import json,os,sys,re,time
from concurrent.futures import ThreadPoolExecutor
import numpy as np
sys.path.insert(0,'.');import llm
V=open('/home/user/diwania-plus/worker/src/ctx/vocab.txt').read().split('\n')
t=np.fromfile('/home/user/diwania-plus/worker/src/ctx/top.bin',dtype=np.uint16);S,K=int(t[0]),int(t[1]);top=t[2:].reshape(S,K)
secrets=[V[top[s,0]] for s in range(S)]
os.makedirs('llm',exist_ok=True)
LIMIT=int(sys.argv[1]) if len(sys.argv)>1 else 100
todo=[w for w in secrets if not os.path.exists(f'llm/{w}.txt')][:LIMIT]
print('todo',len(todo),flush=True)
def go(w):
    for k in range(3):
        try:
            txt=llm.ask(w); open(f'llm/{w}.txt','w').write(txt); return w,'ok'
        except Exception as e: time.sleep(5)
    return w,'fail'
with ThreadPoolExecutor(4) as ex:
    for w,s in ex.map(go,todo): print(w,s,flush=True)
