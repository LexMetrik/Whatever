import re,glob,json,os,collections
S='/private/tmp/claude-501/-Users-david-Developer-LexMetrik/41558c47-09c2-4872-8fe2-5cae65a4c7be/scratchpad/e2e-fang'
j2r={}  # jobid -> (run, attempt, jobname)
for l in open(S+'/shardfail.txt'):
    p=l.split()
    for j in p[2].split(','): j2r[j]=(p[0],'L')
for l in open(S+'/attfail.txt'):
    b,j=l.split(); r,a=b.split('_'); j2r[j]=(r,int(a))
ts=re.compile(r'^\d{4}-\d\d-\d\dT[\d:.]+Z ')
ev=set(); infra=[]
jobshard={}
# latest attempt number per run
runs={}
for l in open(S+'/allruns.jsonl'):
    r=json.loads(l); runs[str(r['id'])]=r
for f in sorted(glob.glob(S+'/logs/*.log')):
    jid=os.path.basename(f)[:-4]
    if jid not in j2r: continue
    run,att=j2r[jid]
    if att=='L': att=runs[run]['a'] if run in runs else 1
    lines=[ts.sub('',l.rstrip('\n')) for l in open(f,errors='replace')]
    mode=None; found=0
    for l in lines:
        m=re.match(r'^  (\d+) (failed|flaky|passed|skipped|did not run|interrupted)',l)
        if m: mode=m.group(2); continue
        if mode in('failed','flaky','interrupted') and l.startswith('    ['):
            m=re.match(r'^    \[([\w-]+)\] › (e2e/[^:]+\.e2e\.ts):(\d+):\d+ › (.*)$',l)
            if m: ev.add((run,att,jid,mode,m.group(2),m.group(4).strip())); found+=1
    if found==0:
        err=[l for l in lines if '##[error]' in l]
        txt=' | '.join(e[:140] for e in err[:3])
        infra.append((run,att,jid,txt))
json.dump({'ev':sorted(ev),'infra':infra},open(S+'/parsed2.json','w'))
print(len(ev),len(infra),collections.Counter(e[3] for e in ev))
