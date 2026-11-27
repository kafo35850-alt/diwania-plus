import json,subprocess,sys
K=open('key').read().strip()
def ask(word,model='@cf/meta/llama-3.3-70b-instruct-fp8-fast'):
    msgs=[{'role':'system','content':'أنت خبير في اللغة العربية واللهجة الخليجية. ترد بقائمة كلمات فقط بدون أي شرح.'},
          {'role':'user','content':f'اكتب 50 كلمة عربية (فصحى وخليجية) مرتبطة بكلمة «{word}» بالمعنى والسياق، مرتبة من الأقرب للأبعد. ابدأ بالمرادفات والأشياء الأقرب جداً ثم الأبعد. كلمات مفردة فقط (اسم أو صفة أو فعل)، بدون تكرار، بدون كلمة «{word}» نفسها، مفصولة بفاصلة عربية «،».'}]
    r=subprocess.run(['curl','-s','--max-time','120','-X','POST','https://diwaniyaplus.com/api/tmp-ai-'+K,'-H','content-type: application/json','-d',json.dumps({'model':model,'messages':msgs,'max_tokens':450},ensure_ascii=False)],capture_output=True,text=True)
    return json.loads(r.stdout)['text']
if __name__=='__main__':
    for w in sys.argv[1:]: print(w,':',ask(w)[:900],'\n')
