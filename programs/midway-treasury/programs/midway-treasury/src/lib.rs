use anchor_lang::prelude::*;
use anchor_lang::system_program::{self, Transfer};

declare_id!("7gMuZXqypiLQQKBgHfCtjzrsSh6MFn6Hk1ftm4h5Ysnc");

pub const TREASURY_SEED: &[u8] = b"treasury";
pub const VAULT_SEED: &[u8] = b"vault";

#[program]
pub mod midway_treasury {
    use super::*;

    /// Creates treasury config PDA + SOL vault. `split_bps` is immutable ([burn, believers, build]).
    pub fn initialize(ctx: Context<Initialize>, split_bps: [u16; 3]) -> Result<()> {
        require!(
            split_bps[0] as u32 + split_bps[1] as u32 + split_bps[2] as u32 == 10_000,
            TreasuryError::InvalidSplit
        );

        let t = &mut ctx.accounts.treasury;
        t.authority = ctx.accounts.authority.key();
        t.token_mint = ctx.accounts.token_mint.key();
        t.split_bps = split_bps;
        t.bump = ctx.bumps.treasury;
        t.vault_bump = ctx.bumps.vault;
        t.burn_balance = 0;
        t.believers_balance = 0;
        t.build_balance = 0;
        t.total_deposited = 0;
        t.total_burned_tokens = 0;
        t.believers_round = 0;
        t.believers_pool_snapshot = 0;

        ctx.accounts.vault.bump = ctx.bumps.vault;

        emit!(TreasuryInitialized {
            authority: t.authority,
            token_mint: t.token_mint,
            split_bps,
        });
        Ok(())
    }

    /// Settle path: deposit house cut lamports, split 40/40/20 into sub-balances.
    pub fn deposit_cut(ctx: Context<DepositCut>, amount: u64) -> Result<()> {
        require!(amount > 0, TreasuryError::ZeroAmount);

        let bps = ctx.accounts.treasury.split_bps;
        let burn_amt = amount
            .checked_mul(bps[0] as u64)
            .ok_or(TreasuryError::MathOverflow)?
            / 10_000;
        let believers_amt = amount
            .checked_mul(bps[1] as u64)
            .ok_or(TreasuryError::MathOverflow)?
            / 10_000;
        let build_amt = amount
            .checked_sub(burn_amt)
            .ok_or(TreasuryError::MathOverflow)?
            .checked_sub(believers_amt)
            .ok_or(TreasuryError::MathOverflow)?;

        let cpi = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            Transfer {
                from: ctx.accounts.depositor.to_account_info(),
                to: ctx.accounts.vault.to_account_info(),
            },
        );
        system_program::transfer(cpi, amount)?;

        let t = &mut ctx.accounts.treasury;
        t.burn_balance = t
            .burn_balance
            .checked_add(burn_amt)
            .ok_or(TreasuryError::MathOverflow)?;
        t.believers_balance = t
            .believers_balance
            .checked_add(believers_amt)
            .ok_or(TreasuryError::MathOverflow)?;
        t.build_balance = t
            .build_balance
            .checked_add(build_amt)
            .ok_or(TreasuryError::MathOverflow)?;
        t.total_deposited = t
            .total_deposited
            .checked_add(amount)
            .ok_or(TreasuryError::MathOverflow)?;

        emit!(CutDeposited {
            depositor: ctx.accounts.depositor.key(),
            amount,
            burn: burn_amt,
            believers: believers_amt,
            build: build_amt,
            total_deposited: t.total_deposited,
        });
        Ok(())
    }

    /// Crank buyback+burn. Drains `burn_balance` SOL to buyback_authority and emits `Burned`.
    /// Jupiter swap+token burn is executed by the off-chain crank (`lib/treasury/buyback.ts`)
    /// which passes the resulting `tokens_burned` for the public event.
    pub fn execute_buyback(ctx: Context<ExecuteBuyback>, tokens_burned: u64) -> Result<()> {
        require_keys_eq!(
            ctx.accounts.buyback_authority.key(),
            ctx.accounts.treasury.authority,
            TreasuryError::Unauthorized
        );

        let sol_in = ctx.accounts.treasury.burn_balance;
        require!(sol_in > 0, TreasuryError::EmptyBurnVault);

        **ctx
            .accounts
            .vault
            .to_account_info()
            .try_borrow_mut_lamports()? -= sol_in;
        **ctx
            .accounts
            .buyback_authority
            .to_account_info()
            .try_borrow_mut_lamports()? += sol_in;

        let t = &mut ctx.accounts.treasury;
        t.burn_balance = 0;
        t.total_burned_tokens = t
            .total_burned_tokens
            .checked_add(tokens_burned)
            .ok_or(TreasuryError::MathOverflow)?;

        emit!(Burned {
            sol_in,
            tokens_burned,
            total_burned_tokens: t.total_burned_tokens,
        });
        Ok(())
    }

    pub fn snapshot_believers(ctx: Context<SnapshotBelievers>) -> Result<()> {
        require_keys_eq!(
            ctx.accounts.authority.key(),
            ctx.accounts.treasury.authority,
            TreasuryError::Unauthorized
        );
        let t = &mut ctx.accounts.treasury;
        t.believers_round = t
            .believers_round
            .checked_add(1)
            .ok_or(TreasuryError::MathOverflow)?;
        t.believers_pool_snapshot = t.believers_balance;

        emit!(BelieversSnapshotted {
            round: t.believers_round,
            pool: t.believers_pool_snapshot,
        });
        Ok(())
    }

    /// Claim pro-rata share. `weight_bps` = caller's weight out of 10_000 for this round.
    pub fn claim_believers(ctx: Context<ClaimBelievers>, weight_bps: u16) -> Result<()> {
        require!(weight_bps > 0 && weight_bps <= 10_000, TreasuryError::InvalidWeight);
        let snapshot = ctx.accounts.treasury.believers_pool_snapshot;
        require!(snapshot > 0, TreasuryError::NoSnapshot);

        let claim = snapshot
            .checked_mul(weight_bps as u64)
            .ok_or(TreasuryError::MathOverflow)?
            / 10_000;
        require!(claim > 0, TreasuryError::ZeroAmount);
        require!(
            claim <= ctx.accounts.treasury.believers_balance,
            TreasuryError::InsufficientVault
        );

        **ctx
            .accounts
            .vault
            .to_account_info()
            .try_borrow_mut_lamports()? -= claim;
        **ctx
            .accounts
            .claimant
            .to_account_info()
            .try_borrow_mut_lamports()? += claim;

        let t = &mut ctx.accounts.treasury;
        t.believers_balance = t
            .believers_balance
            .checked_sub(claim)
            .ok_or(TreasuryError::MathOverflow)?;

        emit!(BelieversClaimed {
            claimant: ctx.accounts.claimant.key(),
            amount: claim,
            round: t.believers_round,
            weight_bps,
        });
        Ok(())
    }

    /// Build vault withdrawal — authority should be a Squads multisig in production.
    pub fn withdraw_build(ctx: Context<WithdrawBuild>, amount: u64) -> Result<()> {
        require!(amount > 0, TreasuryError::ZeroAmount);
        require_keys_eq!(
            ctx.accounts.authority.key(),
            ctx.accounts.treasury.authority,
            TreasuryError::Unauthorized
        );
        require!(
            amount <= ctx.accounts.treasury.build_balance,
            TreasuryError::InsufficientVault
        );

        **ctx
            .accounts
            .vault
            .to_account_info()
            .try_borrow_mut_lamports()? -= amount;
        **ctx
            .accounts
            .destination
            .to_account_info()
            .try_borrow_mut_lamports()? += amount;

        let t = &mut ctx.accounts.treasury;
        t.build_balance = t
            .build_balance
            .checked_sub(amount)
            .ok_or(TreasuryError::MathOverflow)?;

        emit!(BuildWithdrawn {
            authority: ctx.accounts.authority.key(),
            destination: ctx.accounts.destination.key(),
            amount,
        });
        Ok(())
    }
}

#[account]
pub struct Vault {
    pub bump: u8,
}

impl Vault {
    pub const SIZE: usize = 8 + 1;
}

#[account]
pub struct Treasury {
    pub authority: Pubkey,
    pub token_mint: Pubkey,
    /// [burn, believers, build] — immutable, sums to 10_000
    pub split_bps: [u16; 3],
    pub bump: u8,
    pub vault_bump: u8,
    pub burn_balance: u64,
    pub believers_balance: u64,
    pub build_balance: u64,
    pub total_deposited: u64,
    pub total_burned_tokens: u64,
    pub believers_round: u64,
    pub believers_pool_snapshot: u64,
}

impl Treasury {
    // discriminator + fields
    pub const SIZE: usize = 8 + 32 + 32 + 6 + 1 + 1 + 8 + 8 + 8 + 8 + 8 + 8 + 8;
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    /// CHECK: ecosystem mint stored for buyback target
    pub token_mint: UncheckedAccount<'info>,
    #[account(
        init,
        payer = authority,
        space = Treasury::SIZE,
        seeds = [TREASURY_SEED],
        bump
    )]
    pub treasury: Account<'info, Treasury>,
    #[account(
        init,
        payer = authority,
        space = Vault::SIZE,
        seeds = [VAULT_SEED],
        bump
    )]
    pub vault: Account<'info, Vault>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct DepositCut<'info> {
    #[account(mut)]
    pub depositor: Signer<'info>,
    #[account(mut, seeds = [TREASURY_SEED], bump = treasury.bump)]
    pub treasury: Account<'info, Treasury>,
    #[account(mut, seeds = [VAULT_SEED], bump = treasury.vault_bump)]
    pub vault: Account<'info, Vault>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ExecuteBuyback<'info> {
    #[account(mut)]
    pub buyback_authority: Signer<'info>,
    #[account(mut, seeds = [TREASURY_SEED], bump = treasury.bump)]
    pub treasury: Account<'info, Treasury>,
    #[account(mut, seeds = [VAULT_SEED], bump = treasury.vault_bump)]
    pub vault: Account<'info, Vault>,
}

#[derive(Accounts)]
pub struct SnapshotBelievers<'info> {
    pub authority: Signer<'info>,
    #[account(mut, seeds = [TREASURY_SEED], bump = treasury.bump)]
    pub treasury: Account<'info, Treasury>,
}

#[derive(Accounts)]
pub struct ClaimBelievers<'info> {
    #[account(mut)]
    pub claimant: Signer<'info>,
    #[account(mut, seeds = [TREASURY_SEED], bump = treasury.bump)]
    pub treasury: Account<'info, Treasury>,
    #[account(mut, seeds = [VAULT_SEED], bump = treasury.vault_bump)]
    pub vault: Account<'info, Vault>,
}

#[derive(Accounts)]
pub struct WithdrawBuild<'info> {
    pub authority: Signer<'info>,
    #[account(mut, seeds = [TREASURY_SEED], bump = treasury.bump)]
    pub treasury: Account<'info, Treasury>,
    #[account(mut, seeds = [VAULT_SEED], bump = treasury.vault_bump)]
    pub vault: Account<'info, Vault>,
    /// CHECK: destination
    #[account(mut)]
    pub destination: SystemAccount<'info>,
}

#[event]
pub struct TreasuryInitialized {
    pub authority: Pubkey,
    pub token_mint: Pubkey,
    pub split_bps: [u16; 3],
}

#[event]
pub struct CutDeposited {
    pub depositor: Pubkey,
    pub amount: u64,
    pub burn: u64,
    pub believers: u64,
    pub build: u64,
    pub total_deposited: u64,
}

#[event]
pub struct Burned {
    pub sol_in: u64,
    pub tokens_burned: u64,
    pub total_burned_tokens: u64,
}

#[event]
pub struct BelieversSnapshotted {
    pub round: u64,
    pub pool: u64,
}

#[event]
pub struct BelieversClaimed {
    pub claimant: Pubkey,
    pub amount: u64,
    pub round: u64,
    pub weight_bps: u16,
}

#[event]
pub struct BuildWithdrawn {
    pub authority: Pubkey,
    pub destination: Pubkey,
    pub amount: u64,
}

#[error_code]
pub enum TreasuryError {
    #[msg("Split bps must sum to 10000")]
    InvalidSplit,
    #[msg("Amount must be > 0")]
    ZeroAmount,
    #[msg("Math overflow")]
    MathOverflow,
    #[msg("Burn vault is empty")]
    EmptyBurnVault,
    #[msg("Invalid claim weight")]
    InvalidWeight,
    #[msg("No believers snapshot")]
    NoSnapshot,
    #[msg("Insufficient vault balance")]
    InsufficientVault,
    #[msg("Unauthorized")]
    Unauthorized,
}
