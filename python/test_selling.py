
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from matplotlib.patches import Patch
from create_test_set import build_pandas_from_data, macd

def create_signals(df: pd.DataFrame) -> pd.DataFrame:
  _short = 40
  _long = 100
  _macd, _sig = macd(df)
  signals = pd.DataFrame(index=df.index)
  signals['signal'] = 0.0
  signals['short_mavg'] = df['vw'].rolling(window=_short, min_periods=1, center=False).mean()
  signals['long_mavg'] = df['vw'].rolling(window=_long, min_periods=1, center=False).mean()
  signals['recent_percent_change']  = ((df['vw'] - df['vw'].shift(1)) / df['vw'].shift(1) )
  
  _a = _macd[_short:] > _sig[_short:]
  _b = signals['short_mavg'][_short:] > signals['long_mavg'][_short:]
  print(signals['recent_percent_change'])
  _c = np.where(signals['recent_percent_change'][_short:] < 0.02, True, False)
  _sig = _a & _b
  signals['signal'][_short:] = np.where(_sig, 1.0, 0.0)
  # signals['signal'] = np.where(_macd > _sig, 1.0, 0.0)
  # signals['signal'][_short:] = np.where(signals['short_mavg'][_short:] > signals['long_mavg'][_short:], 1.0, 0.0) 
  signals['positions'] = signals['signal'].diff()
  return signals
  
def create_visual(df, signals):
  fig = plt.figure()
  ax1 = fig.add_subplot(111,  ylabel='Price in $', xlabel="Date")
  df['vw'].plot(ax=ax1, color='r', lw=2.)
  signals[['short_mavg', 'long_mavg']].plot(ax=ax1, lw=2.)
  ax1.plot(signals.loc[signals['positions'] == 1.0].datetime, signals['short_mavg'][signals['positions'] == 1.0],'^', markersize=10, color='m')
  ax1.plot(signals.loc[signals['positions'] == -1.0].datetime, signals['short_mavg'][signals['positions'] == -1.0],'v', markersize=10, color='k')
  
  plt.show()

def create_portfolio_visual(ticker, portfolio, df, signals ):
  fig: plt.Figure = plt.figure()
  ax1 = fig.add_subplot(111, ylabel='Portfolio value in $', xlabel="Date")
  # ax3 = fig.add_subplot(111, xlabel="Datetime")

  # Plot the equity curve in dollars
  # print(portfolio.loc[portfolio['datetime'] < 0])
  # ax1.plot(portfolio['datetime'], portfolio['total'],)
  portfolio['total'].plot(ax=ax1, lw=2.)
  # portfolio['datetime'].plot(ax=ax3)
  print(portfolio.datetime)
  # Plot the "buy" trades against the equity curve
  ax1.plot(portfolio.loc[signals['positions'] == 1.0].index, 
          portfolio.total[signals['positions'] == 1.0],
          '^', markersize=10, color='m', label="Buy")

  # Plot the "sell" trades against the equity curve
  ax1.plot(portfolio.loc[signals['positions'] == -1.0].index, 
          portfolio.total[signals['positions'] == -1.0],
          'v', markersize=10, color='k', label="Sell")

  ax2 = ax1.twinx()
  ax2.set_ylabel("Stock Price")
  ax2.plot(df.vw, color="red")
  ax2.plot(signals['short_mavg'], color='teal')
  ax2.plot(signals['long_mavg'], color='orange')

  # ax3 = ax1.twinx()
  # ax3.set_ylabel("Volume Held")
  # ax3.plot(portfolio[ticker], color="pink")

  # print(portfolio.loc[portfolio[ticker] != 0.0 ].diff())
  # print(portfolio.loc[portfolio['stocks_owned'] != 0])
  # fig.tight_layout()
  # plt.legend(loc='upper left')
  plt.figlegend(loc='upper left', handles=[Patch(color="blue", label="Portfolio Value"), Patch(color="red", label="Stock Value")])
  plt.show()



def betting(ticker, df: pd.DataFrame, signals: pd.DataFrame) -> pd.DataFrame:
  initial_capital = float(100000.0)
  positions = pd.DataFrame(index=signals.index).fillna(0.0)
  positions[ticker] = 500*signals['signal']
  portfolio = positions.multiply(df['vw'], axis=0)
  portfolio['datetime'] = df['datetime']
  pos_diff = positions.diff()
  portfolio['holdings'] = (positions.multiply(df['vw'], axis=0)).sum(axis=1)
  # Add `cash` to portfolio
  portfolio['cash'] = initial_capital - (pos_diff.multiply(df['vw'], axis=0)).sum(axis=1).cumsum()
  # positions[ticker] = portfolio['cash'] / df['vw']) * signals['signal']
  # portfolio['cash'] = portfolio['cash'] - positions[ticker]
  # Add `total` to portfolio
  portfolio['total'] = portfolio['cash'] + portfolio['holdings']
  # Add `returns` to portfolio
  portfolio['returns'] = portfolio['total'].pct_change()
  portfolio['stocks_owned'] = positions[ticker] + positions[ticker].shift(1) #positions[ticker].cumsum()
  return portfolio

if __name__ == '__main__':
  df = build_pandas_from_data('AAPL')[-1000:]
  signals = create_signals(df)
  print(signals.loc[signals.positions == 1.0])
  print(signals.positions)
  portfolio = betting('AAPL', df, signals)
  # create_visual(df, signals)
  print("Total Gain:\n", portfolio[['total', 'stocks_owned']].iloc[-1])
  create_portfolio_visual('AAPL', portfolio, df, signals)