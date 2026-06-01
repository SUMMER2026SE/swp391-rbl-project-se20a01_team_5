import pandas as pd
import json

df = pd.read_excel('Project_Tracking.xlsx')
df.to_csv('Project_Tracking.csv', index=False, encoding='utf-8')
