import re,glob,json,os,csv
S='/private/tmp/claude-501/-Users-david-Developer-LexMetrik/41558c47-09c2-4872-8fe2-5cae65a4c7be/scratchpad/e2e-fang'
# job -> run
j2r={}
for l in open(S+'/shardfail.txt'):
    p=l.split()
    for j in p[2].split(','): j2r[j]=p[0]
ts=re.compile(r'^\d{4}-\d\d-\d\dT[\d:.]+Z ')
ev=[] ; infra=[]
for f in sorted(glob.glob(S+'/logs/*.log')):
    jid=os.path.basename(f)[:-4]
    lines=[ts.sub('',l.rstrip('\n')) for l in open(f,errors='replace')]
    mode=None; found=0
    for l in lines:
        m=re.match(r'^  (\d+) (failed|flaky|passed|skipped|did not run|interrupted)',l)
        if m:
            mode=m.group(2); continue
        if mode in('failed','flaky','interrupted') and l.startswith('    [') :
            m=re.match(r'^    \[([\w-]+)\] › (e2e/[^:]+\.e2e\.ts):(\d+):\d+ › (.*)$',l)
            if m:
                ev.append((j2r[jid],jid,mode,m.group(2),m.group(4).strip())); found+=1
        elif mode and not l.startswith('    '): 
            if not re.match(r'^\s*$',l) and not l.startswith('##'): pass
    if found==0:
        # reason
        err=[l for l in lines if '##[error]' in l][:2]
        infra.append((j2r[jid],jid,' | '.join(e[:120] for e in err)))
json.dump({'ev':ev,'infra':infra},open(S+'/parsed.json','w'))
print(len(ev),len(infra))
from collections import Counter
print(Counter(e[2] for e in ev))
