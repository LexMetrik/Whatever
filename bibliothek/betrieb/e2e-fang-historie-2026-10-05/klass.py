import json,re,collections,subprocess,os,csv
S='/private/tmp/claude-501/-Users-david-Developer-LexMetrik/41558c47-09c2-4872-8fe2-5cae65a4c7be/scratchpad/e2e-fang'
d=json.load(open(S+'/parsed2.json'))
pulls={}
for l in open(S+'/pulls.jsonl'):
    q=json.loads(l); pulls[str(q['n'])]=q; r2p=json.load(open(S+'/run2pr.json'))
runs={}; bysha=collections.defaultdict(list)
for l in open(S+'/allruns.jsonl'):
    r=json.loads(l); runs[str(r['id'])]=r; bysha[r['sha']].append(r)
def gh(path):
    f=S+'/cache_'+re.sub(r'\W','_',path)[:150]+'.json'
    if os.path.exists(f): return json.load(open(f))
    o=subprocess.run(['gh','api',path],capture_output=True,text=True).stdout
    open(f,'w').write(o); return json.loads(o) if o else None
def commit_files(sha):
    j=gh(f'repos/LexMetrik/Whatever/commits/{sha}')
    return [x['filename'] for x in (j or {}).get('files',[])]
def ftype(fs):
    P=T=O=False
    for f in fs:
        if f.startswith('e2e/') or re.search(r'\.(test|spec)\.[tj]sx?$',f) or '/__tests__/' in f: T=True
        elif f.startswith('src/') or f.startswith('public/'): P=True
        else: O=True
    return P,T,O
def prdata(n):
    c=[json.loads(l) for l in open(f'{S}/pr/{n}.commits.json')] if os.path.exists(f'{S}/pr/{n}.commits.json') else []
    f=[json.loads(l) for l in open(f'{S}/pr/{n}.files.json')] if os.path.exists(f'{S}/pr/{n}.files.json') else []
    return c,f
# group events
g=collections.defaultdict(dict)  # (run,spec,test)->{att:kind}
for run,att,jid,kind,spec,test in d['ev']:
    g[(run,spec,test)].setdefault(att,set()).add(kind)

failspec=collections.defaultdict(set)
for run,att,jid,kind,spec_,test_ in d['ev']:
    if kind=='failed' and att==runs[run]['a']: failspec[run].add(spec_)
def spec_green(y,spec_):
    """True wenn im Lauf y alle Shards gelaufen sind und spec_ nicht rot war."""
    jobs=gh(f"repos/LexMetrik/Whatever/actions/runs/{y['id']}/jobs?per_page=100")
    sh=[j for j in (jobs or {}).get('jobs',[]) if j['name'].startswith('Browser-Smoke Shard')]
    if not sh or any(j['conclusion'] not in ('success','failure') for j in sh): return None
    if spec_ in failspec.get(str(y['id']),set()): return False
    # Shard rot ohne geparste Tests (Infra)? dann unbekannt
    return True
rows=[]
for (run,spec,test),atts in sorted(g.items()):
    x=runs[run]; pr=r2p[run]; datum=x['t'][:10]; ereignis=x['event']
    A=x['a']
    failedat=[a for a,k in atts.items() if 'failed' in k]
    if not failedat:
        rows.append([run,datum,ereignis,pr,spec,test,'FLAKE-RETRY',x['sha'][:9]]); continue
    k=max(failedat)
    if any(a>k and 'failed' not in atts.get(a,set()) for a in range(k+1,A+1)) or k<A:
        # later attempt exists and test not failed there
        later=[a for a in range(k+1,A+1) if 'failed' in atts.get(a,set())]
        if not later:
            rows.append([run,datum,ereignis,pr,spec,test,'FLAKE-RERUN',x['sha'][:9]+f' attempt{k}->{A}']); continue
    if pr=='main':
        rows.append([run,datum,ereignis,pr,spec,test,'MAIN-ROT?',x['sha'][:9]]); continue
    # same sha other successful run
    same=[y for y in bysha[x['sha']] if y['id']!=x['id'] and y['c']=='success' and y['event']==x['event'] and y['t']>x['t']]
    if same:
        rows.append([run,datum,ereignis,pr,spec,test,'FLAKE-RERUN',x['sha'][:9]+' neuer Lauf '+str(same[0]['id'])]); continue
    commits,files=prdata(pr)
    shas=[c['sha'] for c in commits]
    added=any(f['f']==spec and f['s']=='added' for f in files)
    if ereignis!='merge_group' and x['sha'] in shas:
        i=shas.index(x['sha']); after=commits[i+1:]; mode='kette'
    else:
        after=[c for c in commits if c['date']>x['t']]; mode='zeit'
    # stop at first later green PR run
    green=None
    for ci,c in enumerate(after):
        ys=[y for y in bysha.get(c['sha'],[]) if y['event']=='pull_request']
        ok=[spec_green(y,spec) for y in ys]
        if any(v is True for v in ok):
            green=c['sha']; after=after[:ci+1]; break
    nm=[c for c in after if c['parents']==1]
    fs=[]
    for c in nm: fs+=commit_files(c['sha'])
    fs=set(fs)
    P,T,O=ftype(fs)
    spec_t = spec in fs
    helper_t = any(f.startswith('e2e/') and not f.endswith('.e2e.ts') for f in fs)
    other_spec_t = any(f.endswith('.e2e.ts') and f!=spec for f in fs)
    psrc=any((f.startswith('src/') and not re.search(r'\.(test|spec)\.[tj]sx?$',f) and '/__tests__/' not in f) or f.startswith('public/') for f in fs)
    pmerged=bool(pulls.get(str(pr),{}).get('merged'))
    def isp(f): return (f.startswith('src/') and not re.search(r'\.(test|spec)\.[tj]sx?$',f) and '/__tests__/' not in f) or f.startswith('public/')
    pc=[c for c in nm if any(isp(f) for f in commit_files(c['sha']))]
    key=(pc[0] if pc else (nm[-1] if nm else None))
    beleg=(key['sha'][:9] if key else '-')+f' [{mode};{len(nm)}c;P={int(psrc)};specT={int(spec_t)};helperT={int(helper_t)};otherSpecT={int(other_spec_t)};'+('gruen' if green else 'nogruen')+']'
    if added: kl='FANG-BAU'
    elif not nm: kl='KEIN-FIX-GEMERGT' if pmerged else 'KEIN-FIX-ABGEBROCHEN'
    elif psrc and not spec_t and not helper_t: kl='FANG-PRODUKT'
    elif psrc: kl='FANG-GEMISCHT'
    elif spec_t or helper_t: kl='FANG-TEST'
    else: kl='UNKLAR-NURANDERES'
    if nm and not green and kl.startswith(('FANG','UNKLAR')): kl='OFFEN-'+kl
    rows.append([run,datum,ereignis,pr,spec,test,kl,beleg])
for run,att,jid,txt in d['infra']:
    x=runs[run]
    t=txt
    kl='INFRA'
    if 'e2e/shard-gruppen' in txt or txt.startswith('##[error]Process completed with exit code 1.') and '|' not in txt: kl='INFRA-GATE'
    rows.append([run,x['t'][:10],x['event'],r2p[run],'-','Job '+str(jid)+': '+txt[:110],kl,x['sha'][:9]])
w=csv.writer(open(S+'/treffer.csv','w',newline='')); w.writerow(['lauf_id','datum','ereignis','pr','spec','test','klasse','beleg_commit']); w.writerows(rows)
print(collections.Counter(r[6] for r in rows))
