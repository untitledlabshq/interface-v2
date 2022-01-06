import React, { useState } from 'react';
import { Box, Typography, useMediaQuery } from '@material-ui/core';
import { makeStyles, useTheme } from '@material-ui/core/styles';
import { DualStakingInfo } from 'state/stake/hooks';
import { JSBI, TokenAmount, Pair, ETHER } from '@uniswap/sdk';
import { QUICK, EMPTY } from 'constants/index';
import { unwrappedToken } from 'utils/wrappedCurrency';
import { useDualRewardsStakingContract } from 'hooks/useContract';
import { useTransactionAdder } from 'state/transactions/hooks';
import { DoubleCurrencyLogo, CurrencyLogo } from 'components';
import { useTokenBalance } from 'state/wallet/hooks';
import { useActiveWeb3React } from 'hooks';
import CircleInfoIcon from 'assets/images/circleinfo.svg';
import FarmDualCardDetails from './FarmDualCardDetails';

const useStyles = makeStyles(({ palette, breakpoints }) => ({
  syrupCard: {
    background: palette.secondary.dark,
    width: '100%',
    borderRadius: 10,
    marginTop: 24,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  syrupCardUp: {
    background: palette.secondary.dark,
    width: '100%',
    borderRadius: 10,
    display: 'flex',
    alignItems: 'center',
    padding: '16px',
    cursor: 'pointer',
    [breakpoints.down('xs')]: {
      flexDirection: 'column',
    },
  },
  inputVal: {
    backgroundColor: palette.secondary.contrastText,
    borderRadius: '10px',
    height: '50px',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    '& input': {
      flex: 1,
      background: 'transparent',
      border: 'none',
      boxShadow: 'none',
      outline: 'none',
      fontSize: 16,
      fontWeight: 600,
      color: palette.text.primary,
    },
    '& p': {
      cursor: 'pointer',
    },
  },
  buttonToken: {
    backgroundColor: palette.grey.A400,
    borderRadius: '10px',
    height: '50px',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  buttonClaim: {
    backgroundImage:
      'linear-gradient(280deg, #64fbd3 0%, #00cff3 0%, #0098ff 10%, #004ce6 100%)',
    borderRadius: '10px',
    height: '50px',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: 'white',
  },
  syrupText: {
    fontSize: 14,
    fontWeight: 600,
    color: palette.text.secondary,
  },
}));

const FarmDualCard: React.FC<{
  stakingInfo: DualStakingInfo;
  dQuicktoQuick: number;
  stakingAPY: number;
}> = ({ stakingInfo, dQuicktoQuick, stakingAPY }) => {
  const classes = useStyles();
  const { palette, breakpoints } = useTheme();
  const isMobile = useMediaQuery(breakpoints.down('xs'));
  const [isExpandCard, setExpandCard] = useState(false);
  const [stakeAmount, setStakeAmount] = useState('');
  const [attemptStaking, setAttemptStaking] = useState(false);
  const [attemptUnstaking, setAttemptUnstaking] = useState(false);
  const [attemptClaimReward, setAttemptClaimReward] = useState(false);
  // const [hash, setHash] = useState<string | undefined>();
  const [unstakeAmount, setUnStakeAmount] = useState('');

  const token0 = stakingInfo.tokens[0];
  const token1 = stakingInfo.tokens[1];

  const rewardTokenA = stakingInfo.rewardTokenA;
  const rewardTokenB = stakingInfo.rewardTokenB;

  const { account, library } = useActiveWeb3React();
  const addTransaction = useTransactionAdder();

  const currency0 = unwrappedToken(token0);
  const currency1 = unwrappedToken(token1);
  const baseTokenCurrency = unwrappedToken(stakingInfo.baseToken);
  const empty = unwrappedToken(EMPTY);

  // get the color of the token
  const baseToken =
    baseTokenCurrency === empty ? token0 : stakingInfo.baseToken;

  const totalSupplyOfStakingToken = stakingInfo.totalSupply;
  const stakingTokenPair = stakingInfo.stakingTokenPair;

  const userLiquidityUnstaked = useTokenBalance(
    account ?? undefined,
    stakingInfo.stakedAmount.token,
  );

  let valueOfTotalStakedAmountInBaseToken: TokenAmount | undefined;
  let valueOfMyStakedAmountInBaseToken: TokenAmount | undefined;
  let valueOfUnstakedAmountInBaseToken: TokenAmount | undefined;
  if (
    totalSupplyOfStakingToken &&
    stakingTokenPair &&
    stakingInfo &&
    baseToken
  ) {
    // take the total amount of LP tokens staked, multiply by ETH value of all LP tokens, divide by all LP tokens
    valueOfTotalStakedAmountInBaseToken = new TokenAmount(
      baseToken,
      JSBI.divide(
        JSBI.multiply(
          JSBI.multiply(
            stakingInfo.totalStakedAmount.raw,
            stakingTokenPair.reserveOf(baseToken).raw,
          ),
          JSBI.BigInt(2), // this is b/c the value of LP shares are ~double the value of the WETH they entitle owner to
        ),
        totalSupplyOfStakingToken.raw,
      ),
    );

    valueOfMyStakedAmountInBaseToken = new TokenAmount(
      baseToken,
      JSBI.divide(
        JSBI.multiply(
          JSBI.multiply(
            stakingInfo.stakedAmount.raw,
            stakingTokenPair.reserveOf(baseToken).raw,
          ),
          JSBI.BigInt(2), // this is b/c the value of LP shares are ~double the value of the WETH they entitle owner to
        ),
        totalSupplyOfStakingToken.raw,
      ),
    );

    if (userLiquidityUnstaked) {
      valueOfUnstakedAmountInBaseToken = new TokenAmount(
        baseToken,
        JSBI.divide(
          JSBI.multiply(
            JSBI.multiply(
              userLiquidityUnstaked.raw,
              stakingTokenPair.reserveOf(baseToken).raw,
            ),
            JSBI.BigInt(2),
          ),
          totalSupplyOfStakingToken.raw,
        ),
      );
    }
  }

  // get the USD value of staked WETH
  const USDPrice = stakingInfo.usdPrice;
  const valueOfTotalStakedAmountInUSDC =
    valueOfTotalStakedAmountInBaseToken &&
    USDPrice?.quote(valueOfTotalStakedAmountInBaseToken);

  const valueOfMyStakedAmountInUSDC =
    valueOfMyStakedAmountInBaseToken &&
    USDPrice?.quote(valueOfMyStakedAmountInBaseToken);

  const valueOfUnstakedAmountInUSDC =
    valueOfUnstakedAmountInBaseToken &&
    USDPrice?.quote(valueOfUnstakedAmountInBaseToken);

  let apyWithFee: number | string = 0;

  if (stakingAPY && stakingAPY > 0) {
    apyWithFee =
      ((1 +
        ((Number(stakingInfo.perMonthReturnInRewards) +
          Number(stakingAPY) / 12) *
          12) /
          12) **
        12 -
        1) *
      100;

    if (apyWithFee > 100000000) {
      apyWithFee = '>100000000';
    } else {
      apyWithFee = parseFloat(apyWithFee.toFixed(2)).toLocaleString();
    }
  }

  const tvl = valueOfTotalStakedAmountInUSDC
    ? `$${valueOfTotalStakedAmountInUSDC.toFixed(0, { groupSeparator: ',' })}`
    : `${valueOfTotalStakedAmountInBaseToken?.toSignificant(4, {
        groupSeparator: ',',
      }) ?? '-'} ETH`;

  const poolRateA = `${stakingInfo.totalRewardRateA
    ?.toFixed(2, { groupSeparator: ',' })
    .replace(/[.,]00$/, '') +
    ' ' +
    rewardTokenA?.symbol}  / day`;
  const poolRateB = `${stakingInfo.totalRewardRateB
    ?.toFixed(2, { groupSeparator: ',' })
    .replace(/[.,]00$/, '') +
    ' ' +
    rewardTokenB?.symbol} / day`;

  const stakingContract = useDualRewardsStakingContract(
    stakingInfo.stakingRewardAddress,
  );

  const dummyPair = new Pair(
    new TokenAmount(stakingInfo.tokens[0], '0'),
    new TokenAmount(stakingInfo.tokens[1], '0'),
  );

  const earnedUSD =
    Number(stakingInfo.earnedAmountA.toSignificant()) *
      dQuicktoQuick *
      stakingInfo.quickPrice +
    Number(stakingInfo.earnedAmountB.toSignificant()) * stakingInfo.maticPrice;

  const earnedUSDStr =
    earnedUSD < 0.001 && earnedUSD > 0
      ? '< $0.001'
      : '$' + earnedUSD.toLocaleString();

  const rewards =
    stakingInfo?.rateA * stakingInfo?.quickPrice +
    stakingInfo?.rateB * Number(stakingInfo.rewardTokenBPrice);

  return (
    <Box className={classes.syrupCard}>
      <Box
        className={classes.syrupCardUp}
        onClick={() => setExpandCard(!isExpandCard)}
      >
        <Box
          display='flex'
          alignItems='center'
          justifyContent='space-between'
          width={isMobile ? 1 : 0.3}
          mb={isMobile ? 1.5 : 0}
        >
          {isMobile && (
            <Typography className={classes.syrupText}>Pool</Typography>
          )}
          <Box display='flex' alignItems='center'>
            <DoubleCurrencyLogo
              currency0={currency0}
              currency1={currency1}
              size={28}
            />
            <Box ml={1.5}>
              <Typography variant='body2'>
                {currency0.symbol} / {currency1.symbol} LP
              </Typography>
            </Box>
          </Box>
        </Box>
        <Box
          width={isMobile ? 1 : 0.2}
          mb={isMobile ? 1.5 : 0}
          display='flex'
          justifyContent={isMobile ? 'space-between' : 'center'}
          alignItems='center'
        >
          {isMobile && (
            <Typography className={classes.syrupText}>TVL</Typography>
          )}
          <Typography variant='body2'>{tvl}</Typography>
        </Box>
        <Box
          mb={isMobile ? 1.5 : 0}
          width={isMobile ? 1 : 0.25}
          display='flex'
          justifyContent={isMobile ? 'space-between' : 'center'}
          alignItems='center'
        >
          {isMobile && (
            <Typography className={classes.syrupText}>Rewards</Typography>
          )}
          <Box textAlign={isMobile ? 'right' : 'left'}>
            <Typography variant='body2'>{`$${parseInt(
              rewards.toFixed(0),
            ).toLocaleString()} / day`}</Typography>
            <Typography variant='body2'>{poolRateA}</Typography>
            <Typography variant='body2'>{poolRateB}</Typography>
          </Box>
        </Box>
        <Box
          mb={isMobile ? 1.5 : 0}
          width={isMobile ? 1 : 0.15}
          display='flex'
          alignItems='center'
          justifyContent={isMobile ? 'space-between' : 'center'}
        >
          {isMobile && (
            <Typography className={classes.syrupText}>APY</Typography>
          )}
          <Box display='flex' alignItems='center'>
            <Typography variant='body2' style={{ color: palette.success.main }}>
              {apyWithFee}%
            </Typography>
            <Box ml={1} style={{ height: '16px' }}>
              <img src={CircleInfoIcon} alt={'arrow up'} />
            </Box>
          </Box>
        </Box>
        <Box
          width={isMobile ? 1 : 0.2}
          display='flex'
          justifyContent={isMobile ? 'space-between' : 'flex-end'}
        >
          {isMobile && (
            <Typography className={classes.syrupText}>Earned</Typography>
          )}
          <Box textAlign='right'>
            <Typography variant='body2'>{earnedUSDStr}</Typography>
            <Box display='flex' alignItems='center' justifyContent='flex-end'>
              <CurrencyLogo currency={QUICK} size='16px' />
              <Typography variant='body2' style={{ marginLeft: 5 }}>
                {stakingInfo.earnedAmountA.toSignificant(2)}
                <span>&nbsp;dQUICK</span>
              </Typography>
            </Box>
            <Box display='flex' alignItems='center' justifyContent='flex-end'>
              <CurrencyLogo
                currency={
                  rewardTokenB.symbol?.toLowerCase() === 'wmatic'
                    ? ETHER
                    : rewardTokenB
                }
                size='16px'
              />
              <Typography variant='body2' style={{ marginLeft: 5 }}>
                {stakingInfo.earnedAmountB.toSignificant(2)}
                <span>&nbsp;{rewardTokenB.symbol}</span>
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      {isExpandCard && stakingInfo.stakingTokenPair && (
        <FarmDualCardDetails
          pair={stakingInfo.stakingTokenPair}
          dQuicktoQuick={dQuicktoQuick}
          stakingAPY={stakingAPY}
        />
      )}
    </Box>
  );
};

export default FarmDualCard;