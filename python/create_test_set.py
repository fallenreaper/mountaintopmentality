# Uses Polygon

import json
import os
import glob
from datetime import date
import dateutil.relativedelta
import requests
import time
import pandas as pd
import argparse

# Plotting etc
import matplotlib.pyplot as plt
from matplotlib.patches import Patch


APP_DIR = os.path.dirname(os.path.realpath(__file__))

CONFIG = None
def load_config():
  global CONFIG
  with open("config.json") as fp:
    CONFIG = json.load(fp)
  return CONFIG

CANDLE_DIR = "candledump"
def clean():
  try:
    _dir_to_clean = f"{APP_DIR}/{CANDLE_DIR}"
    _files = glob.glob(f"{_dir_to_clean}/*test*.json")
    # for f in _files:
    #   os.remove(f)
  except Exception as e:
    print(e)

def build_last_n_months(n: int, ticker: str, days: int=None, minutes: int =None):
  # Number of days needs to be positive
  if n <= 0: 
    return
  # Days / Minutes needs to be set correctly.
  if days is None and minutes is None:
    return
  if not (minutes>0 or days>0):
    return
  # Need to have correct token.
  if 'token' not in CONFIG['polygon'] or not CONFIG['polygon']['token']:
    return

  now = date.today()
  start = now.replace(day=1)
  end = now
  counter = 0
  for i in range(n):
    if counter >= CONFIG['polygon']['callsPerMinute']:
      print("Waiting 1 minute.  Calls Per Minute Reached.")
      counter = 0
      time.sleep(60)
    counter += 1
    url = CONFIG['polygon']["routes"]["barAggregate"].format(
      ticker=ticker.upper(),
      multiplier = str(minutes or days),
      timespan = 'minute' if minutes else 'day',
      startDate = str(start),
      endDate = str(end),
      sort = "asc",
      limit = "50000",
      token = CONFIG['polygon']['token']
    )
    try:
      result = requests.get(url).json()
    except Exception as e:
      print("Request Error: ", e)
      return
    os.makedirs(f"{APP_DIR}/{CANDLE_DIR}", exist_ok=True)
    with open(f"{APP_DIR}/{CANDLE_DIR}/{ticker}-{str(start)}-test.json", "w") as fp:
      json.dump(result, fp)

    end = start - dateutil.relativedelta.relativedelta(days=1)
    start = start - dateutil.relativedelta.relativedelta(months=1)

def macd(df: pd.DataFrame):
  exp1 = df.vw.ewm(span=12, adjust=False).mean()
  exp2 = df.vw.ewm(span=26, adjust=False).mean()
  _macd = exp1 - exp2
  exp3 = _macd.ewm(span=9, adjust=False).mean()
  return _macd, exp3

def build_pandas_from_data(ticker: str):
  files = glob.glob(f"{APP_DIR}/{CANDLE_DIR}/{ticker.upper()}*.json")
  data = []
  for f in files:
    with open(f) as fp:
      month = json.load(fp)['results']
      data = data + month
  _sorted = sorted(data, key=lambda row: row['t'])
  df = pd.DataFrame(_sorted)
  df['1 HR MA'] = df['vw'].rolling(12).mean()
  df['datetime'] = pd.to_datetime(df['t'],unit='ms')
  df['rsi'] = rsi(df)
  return df

def rsi(df: pd.DataFrame, n: int= 14):
  _df = df.vw.diff()
  dUp, dDown = _df.copy(), _df.copy()
  dUp[dUp < 0] = 0
  dDown[dDown > 0] = 0
  rollUp = dUp.rolling(n).mean()
  rollDown = dDown.rolling(n).mean()
  return rollUp / rollDown

def createPlot(df: pd.DataFrame):
  _day = int(6.5*12)
  sample = df[400:400+_day]
  _macd, signal = macd(sample)
  handles = []

  figure, ax1 = plt.subplots()
  ax1.set_xlabel("Date")
  ax1.set_ylabel('Stock Value', color='blue')


  ax1.plot(sample.datetime, sample.vw, color='blue', label='APPL Stock')
  handles.append(Patch(color="blue", label="Stock Value"))
  
  ax1.plot(sample.datetime, sample['1 HR MA'], color='orange', label="Moving Average")
  handles.append(Patch(color="orange", label="1 Hr MA"))

  ax2 = ax1.twinx()
  ax2.plot(sample.datetime, _macd, color='green',label='APPL MACD')
  handles.append(Patch(color="green", label="MACD"))

  ax2.plot(sample.datetime, signal, color='pink',label="Signal Line")
  handles.append(Patch(color="pink", label="Signal Line"))

  # ax2.plot(sample.datetime, sample['rsi'], label="RSI", color='cyan')
  # handles.append(Patch(color="cyan", label="RSI")
  figure.tight_layout()
  plt.figlegend(loc='upper left', handles=handles)
  plt.show()


if __name__ == "__main__":
  parser = argparse.ArgumentParser()
  parser.add_argument('ticker', help="Stock Ticker")
  parser.add_argument('--load', help="Builds Data.", action="store_true")
  parser.add_argument('--render', help="Render", action="store_true")
  args = parser.parse_args()
  load_config()
  if not args.load and not args.render:
    print("Need to set `--load` or `--render`")
    parser.print_help()
    exit()
  if args.load:
    print("Building...")
    build_last_n_months(6, args.ticker.upper(), minutes=5)

  if args.render:
    print("Render.")
    df = build_pandas_from_data(args.ticker.upper())
    createPlot(df)
    print(df[:100])