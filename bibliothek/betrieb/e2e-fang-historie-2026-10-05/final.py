import csv,json,subprocess,re,collections,glob,os
S='/private/tmp/claude-501/-Users-david-Developer-LexMetrik/41558c47-09c2-4872-8fe2-5cae65a4c7be/scratchpad/e2e-fang'
R=list(csv.DictReader(open(S+'/treffer_roh_vor_main.csv')))
runs={}
for l in open(S+'/allruns.jsonl'):
    r=json.loads(l); runs[str(r['id'])]=r
pushes=sorted([r for r in runs.values() if r['event']=='push' and r['br']=='main'],key=lambda r:r['t'])
for r in R:
    if r['klasse']!='MAIN-ROT?': continue
    x=runs[r['lauf_id']]; n=[p for p in pushes if p['t']>x['t'] and p['c']=='success'][0]
    files=subprocess.run(['git','diff','--name-only',x['sha'],n['sha']],capture_output=True,text=True,cwd='/Users/david/Developer/LexMetrik').stdout.split()
    # nur Commits die die Spec anfassen
    sc=subprocess.run(['git','log','--format=%h',f"{x['sha']}..{n['sha']}",'--',r['spec']],capture_output=True,text=True,cwd='/Users/david/Developer/LexMetrik').stdout.split()
    if sc:
        r['klasse']='FANG-TEST' if not any(f.startswith(('src/','public/')) for f in subprocess.run(['git','show','--name-only','--format=',sc[-1]],capture_output=True,text=True,cwd='/Users/david/Developer/LexMetrik').stdout.split()) else 'FANG-GEMISCHT'
        r['beleg_commit']=sc[-1]+' [main-push; spec im Fenster angefasst]'
    else:
        r['klasse']='FLAKE-MAIN'; r['beleg_commit']=n['sha'][:9]+' [main-push; naechster gruener Push ohne Spec-Aenderung]'
for r in R:
    if r['klasse']=='KEIN-FIX-GEMERGT': r['klasse']='FLAKE-GEMERGT-OHNE-FIX'
    if r['klasse']=='KEIN-FIX-ABGEBROCHEN': r['klasse']='OFFEN-PR-GESCHLOSSEN'
w=csv.DictWriter(open(S+'/treffer.csv','w',newline=''),fieldnames=R[0].keys()); w.writeheader(); w.writerows(R)
print(collections.Counter(r['klasse'] for r in R))
