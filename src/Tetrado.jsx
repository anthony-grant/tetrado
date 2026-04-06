import { useState, useEffect, useRef, useCallback } from "react";

// localStorage-backed storage shim
const storage = {
  get: async function(key) {
    var v = localStorage.getItem(key);
    if (v === null) throw new Error('not found');
    return { value: v };
  },
  set: async function(key, val) {
    localStorage.setItem(key, String(val));
    return true;
  }
};


const PIECES=[
  {main:'#00F0F0',hi:'#80F8F8',lo:'#007878',lbg:'#B8F0F0',ltx:'#004444'},
  {main:'#F0F000',hi:'#F8F880',lo:'#787800',lbg:'#F0F0A0',ltx:'#444400'},
  {main:'#A000F0',hi:'#D060F8',lo:'#500078',lbg:'#E8B8F8',ltx:'#3C0058'},
  {main:'#00F000',hi:'#80F880',lo:'#007800',lbg:'#B0F0B0',ltx:'#004400'},
  {main:'#F00000',hi:'#F88080',lo:'#780000',lbg:'#F0B8B8',ltx:'#550000'},
  {main:'#0000F0',hi:'#8080F8',lo:'#000078',lbg:'#B8B8F8',ltx:'#000055'},
  {main:'#F0A000',hi:'#F8D080',lo:'#785000',lbg:'#F0D8B0',ltx:'#553300'},
];
const SKINS=['#FF6B9D','#FFD93D','#6BCB77','#4D96FF','#FF9A3C','#C77DFF','#00CFCF','#FF6B6B','#A8FF78','#FFB347'];
const HAIRS=['#FF0080','#00FFFF','#FFD700','#FF4500','#8A2BE2','#00FF7F','#FF6347','#FF1493','#DC143C','#FF8C00'];
const PTS_TASK=100,PTS_EARLY=50;
const DAILY_T=[{count:3,pts:150},{count:5,pts:300},{count:10,pts:750}];
const STREAK_MS=[{days:7,pts:200},{days:14,pts:400},{days:31,pts:1000},{days:100,pts:3000},{days:200,pts:6000},{days:300,pts:10000},{days:365,pts:15000}];
const CATEGORIES={
  home:{label:'HOME',col:'#F0F000',hi:'#F8F880',lo:'#787800',px:['.....##.....','....####....','...######...','..########..','.##########.','.##......##.','.##......##.','.##..##..##.','.##..##..##.','.##..##..##.','.##########.','............']},
  work:{label:'WORK',col:'#0000F0',hi:'#8080F8',lo:'#000078',px:['............','....####....','...##..##...','.##########.','.##########.','.###....###.','.###....###.','.##########.','.###....###.','.###....###.','.##########.','............']},
  personal:{label:'PERSONAL',col:'#00F0F0',hi:'#80F8F8',lo:'#007878',px:['....####....','...######...','...######...','....####....','....####....','.##########.','...######...','...######...','....####....','..##....##..','.##......##.','.##......##.']},
  goals:{label:'GOALS',col:'#F0A000',hi:'#F8D080',lo:'#785000',px:['.##########.','############','.##########.','.##########.','.##########.','..########..','...######...','....####....','....####....','....####....','...######...','..########..']},
  health:{label:'HEALTH',col:'#F00000',hi:'#F88080',lo:'#780000',px:['............','.####.####..','############','############','############','.##########.','..########..','...######...','....####....','.....##.....','............','............']},
  social:{label:'SOCIAL',col:'#00F000',hi:'#80F880',lo:'#007800',px:['.##....##...','.##....##...','.##....##...','####..####..','####..####..','####..####..','.##....##...','.##....##...','##......##..','##......##..','##......##..','............']},
  quest:{label:'SIDE QUEST',col:'#A000F0',hi:'#D060F8',lo:'#500078',px:['.....##.....','.....##.....','.....##.....','.....##.....','.....##.....','.....##.....','.....##.....','.....##.....','..########..','.....##.....','.....##.....','....####....']},
  creative:{label:'CREATIVE',col:'#FF6B9D',hi:'#FF9DBB',lo:'#CC4070',px:['..........##','.........##.','........##..','.......##...','......##....','.....##.....','....##......','...##.......','..##........','.####.......','.####.......','.##.........']},
};
const CAT_KEYS=Object.keys(CATEGORIES);

// ── Hints & song game ─────────────────────────────────────────────────────────
const HINTS=[
  {text:"Let's Tetrado it!",musical:false},
  {text:"To do or Tetrado...",musical:false},
  {text:"Ready, set, Tetrado!",musical:false},
  {text:"Tetrado it to the max!",musical:false},
  {text:"If you do for me, I'll Tetrado for you...",musical:true,
    answer:"I'll Do for You by Father MC",
    url:"https://www.youtube.com/watch?v=i_ywhU3BbOk",
    decoys:["Do It To Me by Lionel Richie","I'll Be There for You by Bon Jovi","Do Me Baby by Prince"]},
  {text:"Tetrado you believe in magic...",musical:true,
    answer:"Do You Believe in Magic by Lovin' Spoonful",
    url:"https://youtu.be/JnbfuAcCqpY?si=1uD7lVDBdI4TY8kP",
    decoys:["Magic by Olivia Newton-John","Believe by Cher","Do You Believe in Love by Huey Lewis"]},
  {text:"Tetrado do do da da da...",musical:true,
    answer:"De Do Do Do, De Da Da Da by The Police",
    url:"https://youtu.be/7v2GDbEmjGE?si=fAvJowO62sXwzeFA",
    decoys:["Da Ya Think I'm Sexy by Rod Stewart","Da Doo Ron Ron by The Crystals","Do Wah Diddy by Manfred Mann"]},
  {text:"Tetrado I do...",musical:true,
    answer:"Do I Do by Stevie Wonder",
    url:"https://youtu.be/QGNR-gv0sRI?si=nuKfZMnrRHP4kmlT",
    decoys:["I Do by 702","Superstition by Stevie Wonder","Do I Do by Lil' Mo"]},
  {text:"All I wanna Tetrado is...complete some tasks",musical:true,
    answer:"All I Wanna Do by Sheryl Crow",
    url:"https://youtu.be/ClbmWkbocoY?si=Rylc3ZeTR9gSYuwI",
    decoys:["Wanna Be Startin' Somethin' by Michael Jackson","All I Want by Kodaline","Everyday People by Sly & The Family Stone"]},
];
function pickHint(){return HINTS[Math.floor(Math.random()*HINTS.length)];}
const SONG_PTS=[50,25,0];

function NoteButton({onActivate}){
  return(
    <button
      onMouseDown={function(e){e.preventDefault();}}
      onClick={function(e){e.stopPropagation();onActivate();}}
      onTouchEnd={function(e){e.preventDefault();e.stopPropagation();onActivate();}}
      title="Secret mode"
      style={{
        flexShrink:0,
        background:'rgba(255,215,0,0.18)',
        border:'1px solid rgba(255,215,0,0.45)',
        color:'#FFD700',
        fontSize:'18px',
        width:'44px',
        alignSelf:'stretch',
        cursor:'pointer',
        display:'flex',
        alignItems:'center',
        justifyContent:'center',
        lineHeight:1,
        transition:'background .12s',
        marginBottom:'10px',
      }}
    >&#9835;</button>
  );
}

function SongGame({hint,onClose,onAward,dark}){
  const t=TH(dark);
  const [opts]=useState(function(){
    const all=[hint.answer].concat(hint.decoys);
    for(let i=all.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));const tmp=all[i];all[i]=all[j];all[j]=tmp;}
    return all;
  });
  const [attempts,setAttempts]=useState(0);
  const [chosen,setChosen]=useState(null);
  const [solved,setSolved]=useState(false);
  const maxTries=3;

  function guess(opt){
    if(solved||attempts>=maxTries)return;
    const newAttempts=attempts+1;
    setAttempts(newAttempts);
    setChosen(opt);
    if(opt===hint.answer){
      setSolved(true);
      const pts=SONG_PTS[attempts]||0;
      if(pts>0)onAward(pts);
    } else if(newAttempts>=maxTries){
      setSolved(true);
    }
  }

  const correct=chosen===hint.answer;
  const failed=solved&&!correct;
  const pts=solved&&correct?SONG_PTS[Math.min(attempts-1,2)]:null;

  return(
    <div style={{position:'fixed',inset:0,zIndex:600,background:'rgba(0,0,0,0.85)',display:'flex',alignItems:'center',justifyContent:'center',padding:'20px',fontFamily:"'Press Start 2P', monospace"}} onClick={onClose}>
      <div style={{background:t.bg,border:'2px solid '+t.panelBdr,padding:'22px',maxWidth:'380px',width:'100%'}} onClick={function(e){e.stopPropagation();}}>
        <div style={{fontSize:'7px',color:'#FFD700',letterSpacing:'2px',marginBottom:'6px'}}>SECRET GAME MODE</div>
        <div style={{fontSize:'6px',color:t.muted,letterSpacing:'1px',marginBottom:'18px'}}>WHICH SONG IS TETRADO REALLY SINGING?</div>
        <div style={{fontFamily:"'VT323', monospace",fontSize:'20px',color:t.accent,lineHeight:1.5,marginBottom:'20px',padding:'12px',background:t.inp,border:'1px solid '+t.panelBdr}}>
          {hint.text} <span style={{color:'#FFD700'}}>&#9835;</span>
        </div>
        {!solved&&<div style={{fontSize:'6px',color:t.muted,letterSpacing:'1px',marginBottom:'10px'}}>
          {'ATTEMPT '+(attempts+1)+' OF '+maxTries+'  —  +'+(SONG_PTS[attempts]||0)+' PTS IF CORRECT'}
        </div>}
        <div style={{display:'flex',flexDirection:'column',gap:'8px',marginBottom:'16px'}}>
          {opts.map(function(opt){
            const isChosen=chosen===opt;
            const isAnswer=opt===hint.answer;
            let bg=t.inp,border='1px solid '+t.panelBdr,col=t.inpFg,cursor='pointer';
            if(solved&&isAnswer){bg='rgba(0,200,80,0.15)';border='2px solid #00C850';col='#00C850';}
            else if(isChosen&&!isAnswer){bg='rgba(220,50,50,0.12)';border='2px solid #CC3333';col='#CC3333';}
            else if(solved){col=t.muted;cursor='default';}
            return(
              <button key={opt} onClick={function(){guess(opt);}} disabled={solved} style={{background:bg,border:border,color:col,fontFamily:"'VT323', monospace",fontSize:'18px',padding:'10px 14px',cursor:cursor,textAlign:'left',lineHeight:1.4,letterSpacing:'1px',transition:'all .12s'}}>
                {opt}
              </button>
            );
          })}
        </div>
        {solved&&(
          <div style={{marginBottom:'16px'}}>
            {correct
              ?<div style={{fontFamily:"'VT323', monospace",fontSize:'20px',color:'#00C850',lineHeight:1.6}}>
                {'CORRECT! '}
                {pts>0&&<span style={{color:'#FFD700'}}>+{pts} PTS AWARDED</span>}
                {pts===0&&<span style={{color:t.muted}}>NO POINTS — YOU GOT THERE THOUGH!</span>}
              </div>
              :<div style={{fontFamily:"'VT323', monospace",fontSize:'20px',color:'#CC3333',lineHeight:1.6}}>
                {'THE ANSWER WAS: '}
                <span style={{color:t.inpFg}}>{hint.answer}</span>
              </div>
            }
            <a href={hint.url} target="_blank" rel="noreferrer" style={{display:'inline-block',marginTop:'10px',fontFamily:"'Press Start 2P', monospace",fontSize:'6px',color:t.accent,letterSpacing:'1px',textDecoration:'none',border:'1px solid '+t.panelBdr,padding:'8px 12px'}}>
              LISTEN ON YOUTUBE &#9654;
            </a>
          </div>
        )}
        <button onClick={onClose} style={{width:'100%',background:'transparent',border:'1px solid '+t.panelBdr,color:t.muted,fontFamily:"'Press Start 2P', monospace",fontSize:'6px',padding:'10px',cursor:'pointer'}}>
          {solved?'CLOSE':'SKIP'}
        </button>
      </div>
    </div>
  );
}

function getToday(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
function getYesterday(){const d=new Date();d.setDate(d.getDate()-1);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
function dateDiff(a,b){return Math.round((new Date(a+'T12:00:00')-new Date(b+'T12:00:00'))/86400000);}
function relDate(d,today){if(d===today)return 'TODAY';const df=dateDiff(today,d);if(df===1)return 'YESTERDAY';if(df<7)return `${df}D AGO`;return new Date(d+'T12:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric'}).toUpperCase();}
function dueInfo(due,today){const df=dateDiff(due,today);if(df<0)return{label:`${-df}D OVERDUE`,hot:true};if(df===0)return{label:'DUE TODAY',hot:true};if(df===1)return{label:'DUE TOMORROW',hot:false};return{label:`+${df}D`,hot:false};}
function fmtScore(n){return n>=1000?`${(n/1000).toFixed(1)}K`:String(n);}
function hashStr(s){let h=5381;for(let i=0;i<s.length;i++)h=(((h<<5)+h)^s.charCodeAt(i))>>>0;return h;}
function seededRand(seed){let s=(seed||1)>>>0;return function(){s=(Math.imul(1664525,s)+1013904223)>>>0;return s/0x100000000;};}

// Notification helpers - all with explicit catch(e) for transpiler compatibility
function safeNotifPermission(){
  try{if(!('Notification' in window))return 'unsupported';return Notification.permission;}
  catch(e){return 'unsupported';}
}
async function requestNotifPermission(){
  try{if(!('Notification' in window))return 'unsupported';return await Notification.requestPermission();}
  catch(e){return 'denied';}
}
function sendNotification(title,body){
  try{if(safeNotifPermission()==='granted'){new Notification(title,{body:body,tag:'tetrado-daily'});return true;}}
  catch(e){return false;}
  return false;
}

function generateAvatar(seed){
  const rng=seededRand(typeof seed==='string'?hashStr(seed):seed);
  const skin=SKINS[Math.floor(rng()*SKINS.length)];const hair=HAIRS[Math.floor(rng()*HAIRS.length)];
  const dk='#0A0A1A',wh='#FEFEFE',lp='#FF4466';
  const G=Array.from({length:24},function(){return Array(24).fill(null);});
  const S=function(r,c,col){if(r>=0&&r<24&&c>=0&&c<24)G[r][c]=col;};
  const bx=function(r1,c1,r2,c2,col){for(let r=r1;r<=r2;r++)for(let c=c1;c<=c2;c++)S(r,c,col);};
  bx(5,4,20,19,skin);
  const hs=Math.floor(rng()*4);
  if(hs===0){bx(0,5,5,18,hair);bx(1,4,5,19,hair);}
  else if(hs===1){bx(3,4,5,19,hair);for(let c=5;c<=17;c+=4)bx(0,c,3,c+1,hair);}
  else if(hs===2){for(let r=0;r<6;r++){const sp=Math.round(8-Math.abs(r-2.5));for(let c=11-sp;c<=12+sp;c++)S(r,c,hair);}bx(5,4,6,19,hair);}
  else{bx(2,6,5,17,hair);bx(5,3,13,4,hair);bx(5,19,13,20,hair);}
  bx(12,3,14,3,skin);bx(12,20,14,20,skin);
  bx(8,6,8,9,dk);bx(8,14,8,17,dk);
  bx(9,6,11,9,wh);S(10,7,dk);S(10,8,dk);
  bx(9,14,11,17,wh);S(10,15,dk);S(10,16,dk);
  if(rng()>0.48){const gc=HAIRS[Math.floor(rng()*HAIRS.length)];for(let r=8;r<=12;r++){S(r,5,gc);S(r,10,gc);S(r,13,gc);S(r,18,gc);}for(let c=5;c<=10;c++){S(8,c,gc);S(12,c,gc);}for(let c=13;c<=18;c++){S(8,c,gc);S(12,c,gc);}S(10,11,gc);S(10,12,gc);}
  S(13,11,skin);S(14,11,skin);S(14,12,skin);
  const ms=Math.floor(rng()*3);
  if(ms===0){bx(16,8,16,15,lp);S(15,8,lp);S(15,15,lp);bx(16,9,16,14,wh);bx(17,8,17,15,lp);S(18,9,lp);S(18,14,lp);}
  else if(ms===1){bx(17,8,17,15,lp);S(16,8,lp);S(16,15,lp);S(18,9,lp);S(18,14,lp);}
  else{bx(16,7,18,16,lp);bx(16,8,17,15,wh);S(17,11,dk);S(17,12,dk);}
  if(rng()>0.5){const b='rgba(255,100,100,0.5)';bx(12,5,13,6,b);bx(12,17,13,18,b);}
  return G;
}

function AvatarCanvas({grid,size,style}){
  size=size||48;style=style||{};
  const ref=useRef(null);
  useEffect(function(){const cv=ref.current;if(!cv||!grid)return;const ctx=cv.getContext('2d');ctx.clearRect(0,0,24,24);for(let r=0;r<24;r++)for(let c=0;c<24;c++){if(grid[r][c]){ctx.fillStyle=grid[r][c];ctx.fillRect(c,r,1,1);}}},[grid]);
  return <canvas ref={ref} width={24} height={24} style={Object.assign({width:size,height:size,imageRendering:'pixelated',display:'block'},style)}/>;
}
function IconCanvas({catKey,size}){
  size=size||20;
  const ref=useRef(null);
  useEffect(function(){const cv=ref.current;const cat=CATEGORIES[catKey];if(!cv||!cat)return;const ctx=cv.getContext('2d');ctx.clearRect(0,0,12,12);cat.px.forEach(function(row,r){Array.from(row).forEach(function(ch,c){if(ch==='#'){ctx.fillStyle=cat.col;ctx.fillRect(c,r,1,1);}});});},[catKey]);
  return <canvas ref={ref} width={12} height={12} style={{width:size,height:size,imageRendering:'pixelated',display:'block'}}/>;
}

const TH=function(dark){return dark?{
  bg:'#06060F',grid:'rgba(0,240,240,0.03)',fg:'#E8F0FF',accent:'#00F0F0',
  muted:'rgba(255,255,255,0.22)',panel:'rgba(0,6,18,0.92)',panelBdr:'rgba(0,240,240,0.18)',
  inp:'rgba(0,240,240,0.04)',inpBdr:'rgba(0,240,240,0.18)',inpFg:'#E8F0FF',
  tabOn:'#00F0F0',tabOnBg:'rgba(0,240,240,0.1)',tabOff:'rgba(0,240,240,0.28)',tabOffBg:'rgba(0,0,0,0.3)',
  sep:'rgba(0,240,240,0.08)',lblToday:'#00F0F0',lblPast:'rgba(0,240,240,0.28)',hdrBdr:'rgba(0,240,240,0.15)',
  scoreCol:'#FFD700',scoreGlow:'0 0 8px rgba(255,215,0,0.55)',
  blkBg:function(c){return c.main+'14';},blkTxt:function(c){return c.main;},blkMeta:function(c){return c.main+'88';}
}:{
  bg:'#EEE9DF',grid:'rgba(0,0,0,0.04)',fg:'#1A1A2E',accent:'#007878',
  muted:'rgba(0,0,0,0.32)',panel:'rgba(255,255,255,0.88)',panelBdr:'rgba(0,150,150,0.22)',
  inp:'rgba(0,0,0,0.04)',inpBdr:'rgba(0,150,150,0.22)',inpFg:'#1A1A2E',
  tabOn:'#007878',tabOnBg:'rgba(0,150,150,0.1)',tabOff:'rgba(0,100,100,0.3)',tabOffBg:'rgba(0,0,0,0.05)',
  sep:'rgba(0,150,150,0.1)',lblToday:'#007878',lblPast:'rgba(0,100,100,0.38)',hdrBdr:'rgba(0,150,150,0.15)',
  scoreCol:'#8A5A00',scoreGlow:'none',
  blkBg:function(c){return c.lbg;},blkTxt:function(c){return c.ltx;},blkMeta:function(c){return c.ltx+'AA';}
};};

// Notification modal
function NotifModal({notifSettings,onSave,onClose,dark}){
  const t=TH(dark);
  const [enabled,setEnabled]=useState(notifSettings.enabled||false);
  const [time,setTime]=useState(notifSettings.time||'09:00');
  const [perm,setPerm]=useState(function(){return safeNotifPermission();});
  const [testSent,setTestSent]=useState(false);

  function handleAllow(){
    requestNotifPermission().then(function(result){
      setPerm(result);
      if(result==='granted')setEnabled(true);
    });
  }
  function handleTest(){
    if(sendNotification('TETRADO','Tetrado today?')){setTestSent(true);setTimeout(function(){setTestSent(false);},2500);}
  }
  function handleSave(){
    onSave({enabled:enabled&&perm==='granted',time:time,lastFiredDate:notifSettings.lastFiredDate||null});
    onClose();
  }

  const isGranted=perm==='granted';
  const permLabel=perm==='granted'?'NOTIFICATIONS ALLOWED':perm==='denied'?'BLOCKED — ENABLE IN BROWSER SETTINGS':perm==='default'?'PERMISSION REQUIRED':'NOT AVAILABLE IN THIS CONTEXT';
  const permColor=perm==='granted'?'rgba(80,220,80,0.85)':perm==='denied'?'rgba(255,80,80,0.8)':perm==='default'?'rgba(240,160,0,0.85)':t.muted;

  return (
    <div style={{position:'fixed',inset:0,zIndex:500,background:'rgba(0,0,0,0.82)',display:'flex',alignItems:'center',justifyContent:'center',padding:'20px',fontFamily:"'Press Start 2P', monospace"}} onClick={onClose}>
      <div style={{background:t.bg,border:'2px solid '+t.panelBdr,padding:'22px',maxWidth:'340px',width:'100%'}} onClick={function(e){e.stopPropagation();}}>
        <div style={{fontSize:'8px',color:t.accent,letterSpacing:'2px',marginBottom:'18px'}}>DAILY REMINDER</div>

        <div style={{display:'flex',alignItems:'center',gap:'8px',background:t.inp,border:'1px solid '+t.panelBdr,padding:'8px 10px',marginBottom:'16px'}}>
          <span style={{color:permColor,fontSize:'10px',lineHeight:1}}>●</span>
          <span style={{fontSize:'5px',color:permColor,letterSpacing:'1px',lineHeight:1.6}}>{permLabel}</span>
        </div>

        {perm==='default'&&<button onClick={handleAllow} style={{width:'100%',background:t.accent,border:'none',color:'#001414',fontFamily:"'Press Start 2P', monospace",fontSize:'7px',padding:'10px',cursor:'pointer',letterSpacing:'1px',marginBottom:'14px'}}>ALLOW NOTIFICATIONS</button>}

        <div style={{marginBottom:'16px'}}>
          <div style={{fontSize:'6px',color:t.muted,letterSpacing:'2px',marginBottom:'10px'}}>REMINDER</div>
          <div style={{display:'flex',gap:'8px'}}>
            {[false,true].map(function(val){
              const isOn=enabled===val;
              const lbl=val?'ON':'OFF';
              const col=val?'#00F000':'rgba(255,80,80,0.7)';
              return <button key={lbl} onClick={function(){val&&!isGranted?handleAllow():setEnabled(val);}} style={{flex:1,fontFamily:"'Press Start 2P', monospace",fontSize:'8px',padding:'10px',cursor:'pointer',border:'none',background:isOn?col+'18':t.inp,color:isOn?col:t.muted,borderTop:'3px solid '+(isOn?col:t.panelBdr),borderLeft:'3px solid '+(isOn?col+'80':t.panelBdr),borderRight:'3px solid '+(isOn?'rgba(0,0,0,0.4)':t.panelBdr),borderBottom:'3px solid '+(isOn?'rgba(0,0,0,0.4)':t.panelBdr),letterSpacing:'2px'}}>{lbl}</button>;
            })}
          </div>
        </div>

        {enabled&&isGranted&&<div style={{marginBottom:'16px'}}>
          <div style={{fontSize:'6px',color:t.muted,letterSpacing:'2px',marginBottom:'8px'}}>NOTIFY AT</div>
          <input type="time" value={time} onChange={function(e){setTime(e.target.value);}} style={{width:'100%',background:t.inp,border:'1px solid '+t.inpBdr,color:t.inpFg,fontFamily:"'VT323', monospace",fontSize:'26px',padding:'8px 12px',outline:'none',colorScheme:dark?'dark':'light',letterSpacing:'2px'}}/>
        </div>}

        {isGranted&&enabled&&<button onClick={handleTest} style={{width:'100%',marginBottom:'12px',background:'transparent',border:'1px solid '+t.panelBdr,color:testSent?'#80FF80':t.accent,fontFamily:"'Press Start 2P', monospace",fontSize:'6px',padding:'9px',cursor:'pointer',letterSpacing:'1px'}}>{testSent?'SENT!':'SEND TEST NOTIFICATION'}</button>}

        <div style={{fontFamily:"'VT323', monospace",fontSize:'14px',color:t.muted,lineHeight:1.6,marginBottom:'16px',padding:'10px',background:t.inp,border:'1px solid '+t.panelBdr}}>
          {isGranted?'Opens the app after your set time? You\'ll get the reminder immediately. Install as a PWA for true background notifications.':'Install TETRADO as a PWA on your home screen to receive daily reminders even when the app is closed.'}
        </div>

        <div style={{display:'flex',gap:'8px'}}>
          <button onClick={onClose} style={{flex:1,background:'transparent',border:'1px solid '+t.panelBdr,color:t.muted,fontFamily:"'Press Start 2P', monospace",fontSize:'6px',padding:'10px',cursor:'pointer'}}>CANCEL</button>
          <button onClick={handleSave} style={{flex:1,background:t.accent,border:'none',color:'#001414',fontFamily:"'Press Start 2P', monospace",fontSize:'6px',padding:'10px',cursor:'pointer'}}>SAVE</button>
        </div>
      </div>
    </div>
  );
}

function CategoryPicker({currentCat,onSelect,onClose,dark}){
  const t=TH(dark);
  return (
    <div style={{position:'fixed',inset:0,zIndex:400,background:'rgba(0,0,0,0.75)',display:'flex',alignItems:'center',justifyContent:'center',padding:'20px',fontFamily:"'Press Start 2P', monospace"}} onClick={onClose}>
      <div style={{background:t.bg,border:'2px solid '+t.panelBdr,padding:'18px',maxWidth:'340px',width:'100%'}} onClick={function(e){e.stopPropagation();}}>
        <div style={{fontSize:'6px',color:t.accent,letterSpacing:'2px',marginBottom:'14px'}}>SELECT CATEGORY</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4, 1fr)',gap:'8px',marginBottom:'12px'}}>
          {CAT_KEYS.map(function(key){const cat=CATEGORIES[key];const on=currentCat===key;return(
            <div key={key} onClick={function(){onSelect(key);onClose();}} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'6px',padding:'10px 4px',cursor:'pointer',background:on?cat.col+'22':t.inp,border:'2px solid '+(on?cat.col:t.panelBdr),transition:'all .12s'}}>
              <IconCanvas catKey={key} size={22}/>
              <span style={{fontSize:'4px',color:on?cat.col:t.muted,letterSpacing:'1px',textAlign:'center',lineHeight:1.5}}>{cat.label}</span>
            </div>
          );})}
        </div>
        {currentCat&&<button onClick={function(){onSelect(null);onClose();}} style={{width:'100%',marginBottom:'8px',background:'transparent',border:'1px solid '+t.panelBdr,color:t.muted,fontFamily:"'Press Start 2P',monospace",fontSize:'5px',padding:'8px',cursor:'pointer',letterSpacing:'1px'}}>CLEAR CATEGORY</button>}
        <button onClick={onClose} style={{width:'100%',background:'transparent',border:'1px solid '+t.panelBdr,color:t.muted,fontFamily:"'Press Start 2P',monospace",fontSize:'6px',padding:'9px',cursor:'pointer'}}>CANCEL</button>
      </div>
    </div>
  );
}

function Certificate({award,user,onDismiss}){
  const name=user?user.username:'PLAYER';
  const coins=Array.from({length:22},function(_,i){return{id:i,left:(4+(i*4.1)%90)+'%',delay:(i*0.09)%1.6+'s',dur:1.4+(i*0.08)%0.9+'s'};});
  let title,msg;
  if(award.type==='early'){title='AHEAD OF SCHEDULE';msg=(award.taskName||'TASK').substring(0,22).toUpperCase()+' COMPLETED IN RECORD TIME—CONGRATULATIONS '+name+'!';}
  else if(award.type==='daily'){const ds=new Date(award.date+'T12:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric'}).toUpperCase();title=award.count+'x COMBO CLEAR';msg='ALL '+award.count+' TASKS COMPLETED FOR '+ds+'—WELL DONE '+name+'!';}
  else if(award.type==='streak'){title=award.streak+'-DAY STREAK';msg='STREAKS AND YOUR SUCCESS GO HAND IN HAND—KEEP BUILDING!';}
  else if(award.type==='song'){title='MUSIC MASTER';msg=name+' KNOWS THEIR CLASSICS—WELL PLAYED!';}
  else{title='TETRADO MASTER';msg=name+' YOU ARE BECOMING A TETRADO MASTER—KEEP GOING!';}
  return(
    <div style={{position:'fixed',inset:0,zIndex:1000,background:'rgba(0,0,0,0.88)',display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden',fontFamily:"'Press Start 2P', monospace"}} onClick={onDismiss}>
      {coins.map(function(cn){return <span key={cn.id} style={{position:'absolute',top:0,left:cn.left,fontSize:'18px',color:'#FFD700',animation:'coinFall '+cn.dur+' '+cn.delay+' linear both',pointerEvents:'none',userSelect:'none'}}>o</span>;})}
      <div className="cert-card" style={{position:'relative',zIndex:1,background:'#06060F',border:'3px solid #00F0F0',boxShadow:'0 0 0 6px #A000F0, 0 0 0 9px #F0A000, 0 0 0 12px #00F0F0',padding:'30px 26px 24px',maxWidth:'360px',width:'90%',textAlign:'center'}} onClick={function(e){e.stopPropagation();}}>
        {user&&<div style={{display:'flex',alignItems:'center',gap:'10px',justifyContent:'center',marginBottom:'18px'}}><AvatarCanvas grid={user.grid} size={34}/><span style={{fontSize:'7px',color:'#00F0F0',letterSpacing:'2px'}}>{name}</span></div>}
        <div style={{fontSize:'8px',color:'rgba(255,215,0,0.55)',letterSpacing:'2px',marginBottom:'10px'}}>{title}</div>
        <div style={{fontSize:'34px',color:'#FFD700',letterSpacing:'4px',marginBottom:'2px'}}>+{award.pts}</div>
        <div style={{fontSize:'6px',color:'rgba(255,215,0,0.4)',letterSpacing:'3px',marginBottom:'18px'}}>BONUS POINTS AWARDED</div>
        <div style={{fontFamily:"'VT323', monospace",fontSize:'17px',color:'#C0D0FF',lineHeight:1.7,letterSpacing:'1px',marginBottom:'22px',padding:'0 4px'}}>{msg}</div>
        <button onClick={onDismiss} style={{background:'#00F0F0',border:'none',color:'#001414',fontFamily:"'Press Start 2P', monospace",fontSize:'8px',padding:'10px 24px',cursor:'pointer',letterSpacing:'1px',boxShadow:'0 4px 0 #007878'}}>CONTINUE</button>
      </div>
    </div>
  );
}

function LoginScreen({onLogin}){
  const [username,setUsername]=useState('');
  const [grid,setGrid]=useState(function(){return generateAvatar(Math.floor(Math.random()*0xFFFFFF));});
  function regen(){setGrid(generateAvatar(Math.floor(Math.random()*0xFFFFFF)));}
  function submit(){if(username.trim())onLogin({username:username.trim(),grid:grid,seed:0});}
  const ok=username.trim().length>0;
  return(
    <div style={{minHeight:'100vh',background:'#06060F',backgroundImage:'linear-gradient(rgba(0,240,240,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(0,240,240,0.03) 1px,transparent 1px)',backgroundSize:'28px 28px',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'Press Start 2P', monospace",padding:'24px'}}>
      <style>{'@import url(\'https://fonts.googleapis.com/css2?family=Press+Start+2P&family=VT323&display=swap\');*{box-sizing:border-box;}'}</style>
      <div style={{maxWidth:'380px',width:'100%',textAlign:'center'}}>
        <div style={{fontSize:'22px',color:'#00F0F0',letterSpacing:'6px',marginBottom:'6px'}}>TETRADO</div>
        <div style={{fontSize:'6px',color:'rgba(0,240,240,0.3)',letterSpacing:'3px',marginBottom:'40px'}}>TASK MACHINE</div>
        <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'14px',marginBottom:'30px'}}>
          <div style={{padding:'10px',background:'rgba(0,240,240,0.06)',border:'2px solid rgba(0,240,240,0.22)',cursor:'pointer'}} onClick={regen}><AvatarCanvas grid={grid} size={120}/></div>
          <button onClick={regen} style={{background:'transparent',border:'1px solid rgba(0,240,240,0.3)',color:'rgba(0,240,240,0.65)',fontFamily:"'Press Start 2P', monospace",fontSize:'6px',padding:'8px 14px',cursor:'pointer',letterSpacing:'1px'}}>REROLL AVATAR</button>
        </div>
        <div style={{marginBottom:'22px'}}>
          <div style={{fontSize:'6px',color:'rgba(0,240,240,0.4)',letterSpacing:'2px',marginBottom:'10px',textAlign:'left'}}>YOUR NAME</div>
          <input placeholder="ENTER USERNAME..." value={username} onChange={function(e){setUsername(e.target.value.slice(0,16));}} onKeyDown={function(e){if(e.key==='Enter')submit();}} style={{width:'100%',background:'rgba(0,240,240,0.04)',border:'1px solid rgba(0,240,240,0.22)',color:'#E8F0FF',fontFamily:"'VT323', monospace",fontSize:'24px',padding:'10px 12px',outline:'none',caretColor:'#00F0F0',textAlign:'center',letterSpacing:'2px'}}/>
        </div>
        <button onClick={submit} disabled={!ok} style={{background:ok?'#00F0F0':'rgba(0,240,240,0.12)',border:'none',color:ok?'#001414':'rgba(0,240,240,0.28)',fontFamily:"'Press Start 2P', monospace",fontSize:'9px',padding:'12px 28px',cursor:ok?'pointer':'default',letterSpacing:'1px',boxShadow:ok?'0 4px 0 #007878':'none'}}>START GAME</button>
      </div>
    </div>
  );
}

function ProfileModal({user,onSave,onClose,dark}){
  const t=TH(dark);
  const [name,setName]=useState(user.username);
  const [grid,setGrid]=useState(user.grid);
  function regen(){setGrid(generateAvatar(Math.floor(Math.random()*0xFFFFFF)));}
  function save(){if(name.trim())onSave(Object.assign({},user,{username:name.trim(),grid:grid}));}
  return(
    <div style={{position:'fixed',inset:0,zIndex:500,background:'rgba(0,0,0,0.82)',display:'flex',alignItems:'center',justifyContent:'center',padding:'20px',fontFamily:"'Press Start 2P', monospace"}} onClick={onClose}>
      <div style={{background:t.bg,border:'2px solid '+t.panelBdr,padding:'24px',maxWidth:'310px',width:'100%',textAlign:'center'}} onClick={function(e){e.stopPropagation();}}>
        <div style={{fontSize:'8px',color:t.accent,letterSpacing:'2px',marginBottom:'20px'}}>EDIT PROFILE</div>
        <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'12px',marginBottom:'18px'}}>
          <div style={{padding:'8px',background:t.inp,border:'2px solid '+t.panelBdr,cursor:'pointer'}} onClick={regen}><AvatarCanvas grid={grid} size={88}/></div>
          <button onClick={regen} style={{background:'transparent',border:'1px solid '+t.panelBdr,color:t.accent,fontFamily:"'Press Start 2P', monospace",fontSize:'6px',padding:'7px 12px',cursor:'pointer'}}>REROLL</button>
        </div>
        <input value={name} onChange={function(e){setName(e.target.value.slice(0,16));}} onKeyDown={function(e){if(e.key==='Enter')save();}} style={{width:'100%',background:t.inp,border:'1px solid '+t.inpBdr,color:t.inpFg,fontFamily:"'VT323', monospace",fontSize:'22px',padding:'9px 12px',outline:'none',caretColor:t.accent,textAlign:'center',letterSpacing:'2px',marginBottom:'14px'}}/>
        <div style={{display:'flex',gap:'8px'}}>
          <button onClick={onClose} style={{flex:1,background:'transparent',border:'1px solid '+t.panelBdr,color:t.muted,fontFamily:"'Press Start 2P', monospace",fontSize:'6px',padding:'10px',cursor:'pointer'}}>CANCEL</button>
          <button onClick={save} style={{flex:1,background:t.accent,border:'none',color:'#001414',fontFamily:"'Press Start 2P', monospace",fontSize:'6px',padding:'10px',cursor:'pointer'}}>SAVE</button>
        </div>
      </div>
    </div>
  );
}

function TaskBlock({t,dropping,isClearing,today,dark,onComplete,onRemove,onCategoryChange}){
  const [showPicker,setShowPicker]=useState(false);
  const th=TH(dark);const c=PIECES[t.ci%PIECES.length];
  const cat=t.category?CATEGORIES[t.category]:null;
  const di=!t.done?dueInfo(t.due,today):null;
  const txtCol=th.blkTxt(c);
  const metaCol=th.blkMeta(c);
  const bdrHi=dark?c.hi:c.main;
  const bdrLo=dark?c.lo:c.ltx;
  return(
    <>
      {showPicker&&<CategoryPicker currentCat={t.category||null} onSelect={function(key){onCategoryChange(key);}} onClose={function(){setShowPicker(false);}} dark={dark}/>}
      <div className={'blk'+(dropping?' dropping':'')+(isClearing?' clearing':'')}>
        <div style={{display:'flex',minHeight:'74px',background:th.blkBg(c),borderTop:'3px solid '+bdrHi,borderLeft:'3px solid '+bdrHi+'70',borderRight:'3px solid '+bdrLo+'CC',borderBottom:'3px solid '+bdrLo+'CC',position:'relative',opacity:t.done?0.42:1}}>
          {[{t:0,l:0},{t:0,r:0},{b:0,l:0},{b:0,r:0}].map(function(p,j){return <span key={j} style={{position:'absolute',width:'5px',height:'5px',background:th.bg,top:p.t!==undefined?0:'auto',bottom:p.b!==undefined?0:'auto',left:p.l!==undefined?0:'auto',right:p.r!==undefined?0:'auto'}}/>;  })}
          <div onClick={function(){if(!t.done)setShowPicker(true);}} title={cat?cat.label+' tap to change':'Tap to set category'} style={{width:'40px',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',borderRight:'1px solid '+(cat?cat.col+'35':(dark?'rgba(255,255,255,0.06)':'rgba(0,0,0,0.08)')),cursor:t.done?'default':'pointer',background:cat?cat.col+'0C':'transparent'}}>
            {cat?<IconCanvas catKey={t.category} size={20}/>:<span style={{color:txtCol+'30',fontSize:'16px',lineHeight:1,fontFamily:'monospace',userSelect:'none'}}>+</span>}
          </div>
          <div style={{flex:1,padding:'11px 50px 10px 10px',display:'flex',flexDirection:'column',justifyContent:'space-between'}}>
            <div style={{fontFamily:"'VT323', monospace",fontSize:'23px',color:txtCol,letterSpacing:'1px',lineHeight:1.3,marginBottom:'5px',wordBreak:'break-word',textDecoration:t.done?'line-through':'none'}}>{t.text}</div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',fontSize:'6px',letterSpacing:'1px',color:metaCol}}>
              <span>{relDate(t.created,today)}</span>
              {di&&<span className={di.hot?'urgent-blink':''} style={{padding:'2px 7px',background:di.hot?(dark?'rgba(255,40,40,0.2)':'rgba(180,0,0,0.12)'):'rgba(0,0,0,0.1)',color:di.hot?(dark?'#FF8888':c.ltx):metaCol}}>{di.label}</span>}
              {t.done&&<span style={{color:dark?'rgba(80,255,80,0.5)':c.ltx+'88'}}>CLEARED</span>}
            </div>
          </div>
          <div className="acts" style={{position:'absolute',top:'50%',right:'8px',transform:'translateY(-50%)',display:'flex',flexDirection:'column',gap:'5px',opacity:t.done?1:0,transition:'opacity .15s'}}>
            {!t.done&&<button className="act ok" onClick={onComplete}>ok</button>}
            <button className="act del" onClick={onRemove}>x</button>
          </div>
        </div>
      </div>
    </>
  );
}

function getTomorrow(){
  var d=new Date();d.setDate(d.getDate()+1);
  return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
}

function NewTaskPanel({hint,dark,input,dueDate,dueSelected,today,onInput,onSelectDue,onDrop,onNote,inputRef,th}){
  var tomorrow=getTomorrow();
  var hasText=input.trim().length>0;
  var quickOpts=[{label:'TODAY',val:today},{label:'TOMORROW',val:tomorrow},{label:'NO DATE',val:'none'}];
  // Custom date is set if dueDate exists and isn't today or tomorrow
  var isCustom=dueSelected&&dueDate&&dueDate!==today&&dueDate!==tomorrow;
  return(
    <div style={{margin:'18px 0'}}>
      <div style={{fontSize:'7px',letterSpacing:'2px',padding:'18px 0 10px',marginBottom:'10px',borderBottom:'1px solid '+th.sep,color:th.lblToday}}>NEW TASK</div>
      <div style={{background:th.panel,border:'2px solid '+th.panelBdr,padding:'14px'}}>
        <div style={{position:'relative',display:'flex',gap:'0',marginBottom:'12px'}}>
          {hint.musical&&<NoteButton dark={dark} onActivate={onNote}/>}
          <input ref={inputRef} className="ti" placeholder={hint.text} value={input}
            onChange={function(e){onInput(e.target.value);}}
            onKeyDown={function(e){if(e.key==='Enter'&&hasText&&dueSelected)onDrop();}}
            style={{flex:1,background:th.inp,borderColor:th.inpBdr,color:th.inpFg,borderLeft:hint.musical?'none':'1px solid '+th.inpBdr}}/>
        </div>
        {hasText&&(
          <div style={{animation:'fadeIn .18s ease both'}}>
            <div style={{fontSize:'6px',color:th.accent,letterSpacing:'2px',marginBottom:'10px'}}>WHEN IS IT DUE?</div>
            <div style={{display:'flex',gap:'6px',flexWrap:'wrap',marginBottom:'12px'}}>
              {quickOpts.map(function(opt){
                var chosen=opt.val==='none'?(dueSelected&&dueDate===''):(dueDate===opt.val&&dueSelected);
                return(
                  <button key={opt.label} onClick={function(){
                    onSelectDue(opt.val==='none'?'':opt.val);
                  }} style={{fontFamily:"'Press Start 2P', monospace",fontSize:'6px',padding:'8px 12px',cursor:'pointer',border:'2px solid '+(chosen?th.tabOn:th.panelBdr),background:chosen?th.tabOnBg:th.inp,color:chosen?th.tabOn:th.muted,letterSpacing:'1px',transition:'all .12s'}}>{opt.label}</button>
                );
              })}
              <input type="date" value={isCustom?dueDate:''}
                onChange={function(e){if(e.target.value)onSelectDue(e.target.value);}}
                style={{fontFamily:"'Press Start 2P', monospace",fontSize:'6px',padding:'8px 10px',cursor:'pointer',border:'2px solid '+(isCustom?th.tabOn:th.panelBdr),background:isCustom?th.tabOnBg:th.inp,color:isCustom?th.tabOn:th.inpFg,letterSpacing:'1px',colorScheme:dark?'dark':'light',flex:1,minWidth:'120px'}}/>
            </div>
            <button className="drop-btn" onClick={onDrop} disabled={!dueSelected}
              style={{width:'100%',opacity:dueSelected?1:0.35,cursor:dueSelected?'pointer':'default',boxShadow:dueSelected?'0 4px 0 #007878':'none'}}>
              DROP
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function AboutPage({user,dark,score,streak,onEditProfile,onClose}){
  const t=TH(dark);
  const name=user?user.username:'PLAYER';
  return(
    <div style={{position:'fixed',inset:0,zIndex:500,background:t.bg,overflowY:'auto',fontFamily:"'Press Start 2P', monospace",display:'flex',flexDirection:'column'}}>
      {/* Header */}
      <div style={{padding:'24px 22px 16px',borderBottom:'2px solid '+t.hdrBdr,display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
        <div style={{fontSize:'8px',color:t.accent,letterSpacing:'3px'}}>PROFILE</div>
        <button onClick={onClose} style={{background:'transparent',border:'1px solid '+t.panelBdr,color:t.muted,fontFamily:"'Press Start 2P', monospace",fontSize:'6px',padding:'8px 12px',cursor:'pointer',letterSpacing:'1px'}}>CLOSE</button>
      </div>

      {/* Avatar + name */}
      <div style={{padding:'32px 22px 24px',borderBottom:'1px solid '+t.sep,display:'flex',flexDirection:'column',alignItems:'center',gap:'16px',flexShrink:0}}>
        <div style={{padding:'10px',background:t.inp,border:'2px solid '+t.panelBdr,cursor:'pointer'}} onClick={onEditProfile} title="Edit profile">
          <AvatarCanvas grid={user.grid} size={96}/>
        </div>
        <div style={{textAlign:'center'}}>
          <div style={{fontSize:'14px',color:t.accent,letterSpacing:'4px',marginBottom:'8px'}}>{name}</div>
          <button onClick={onEditProfile} style={{background:'transparent',border:'1px solid '+t.panelBdr,color:t.muted,fontFamily:"'Press Start 2P', monospace",fontSize:'5px',padding:'7px 12px',cursor:'pointer',letterSpacing:'1px'}}>EDIT PROFILE</button>
        </div>
      </div>

      {/* Stats */}
      <div style={{padding:'24px 22px',borderBottom:'1px solid '+t.sep,display:'flex',gap:'12px',flexShrink:0}}>
        {[{label:'POINTS',val:score>=1000?(score/1000).toFixed(1)+'K':String(score)},{label:'DAY STREAK',val:String(streak)}].map(function(s){return(
          <div key={s.label} style={{flex:1,background:t.inp,border:'1px solid '+t.panelBdr,padding:'14px 12px',textAlign:'center'}}>
            <div style={{fontSize:'18px',color:t.scoreCol,textShadow:t.scoreGlow,marginBottom:'8px',fontFamily:"'VT323', monospace",letterSpacing:'2px'}}>{s.val}</div>
            <div style={{fontSize:'5px',color:t.muted,letterSpacing:'1px'}}>{s.label}</div>
          </div>
        );})}
      </div>

      {/* Spacer pushes footer down */}
      <div style={{flex:1}}/>

      {/* Footer — version + credit */}
      <div style={{padding:'28px 22px 36px',borderTop:'1px solid '+t.sep,flexShrink:0}}>
        <div style={{marginBottom:'18px',textAlign:'center'}}>
          <div style={{fontSize:'5px',color:t.muted,letterSpacing:'2px',marginBottom:'10px'}}>VERSION 1.0.0</div>
          <div style={{fontFamily:"'VT323', monospace",fontSize:'16px',color:t.muted,letterSpacing:'1px',lineHeight:1.8}}>
            Created by{' '}
            <a href="https://buymeacoffee.com/argstudios" target="_blank" rel="noreferrer" style={{color:t.accent,textDecoration:'none',borderBottom:'1px solid '+t.accent}}>
              Anthony Grant
            </a>
          </div>
        </div>
        <a href="https://buymeacoffee.com/argstudios" target="_blank" rel="noreferrer" style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'10px',background:'#FFDD00',border:'none',padding:'14px 20px',cursor:'pointer',textDecoration:'none',width:'100%'}}>
          <span style={{fontSize:'20px'}}>☕</span>
          <span style={{fontFamily:"'Press Start 2P', monospace",fontSize:'7px',color:'#000000',letterSpacing:'1px'}}>BUY ME A COFFEE</span>
        </a>
      </div>
    </div>
  );
}

export default function Tetrado(){
  const TODAY=getToday();
  const [user,setUser]=useState(null);
  const [tasks,setTasks]=useState([]);
  const [score,setScore]=useState(0);
  const [streak,setStreak]=useState(0);
  const [dark,setDark]=useState(true);
  const [tab,setTab]=useState('active');
  const [input,setInput]=useState('');
  const [dueDate,setDueDate]=useState('');
  const [dueSelected,setDueSelected]=useState(false);
  const [loaded,setLoaded]=useState(false);
  const [dropping,setDropping]=useState(null);
  const [clearing,setClearing]=useState(new Set());
  const [awards,setAwards]=useState([]);
  const [editProfile,setEditProfile]=useState(false);
  const [showNotif,setShowNotif]=useState(false);
  const [notifSettings,setNotifSettings]=useState({enabled:false,time:'09:00',lastFiredDate:null});
  const [floatPts,setFloatPts]=useState([]);
  const [hint]=useState(function(){return pickHint();});
  const [songGame,setSongGame]=useState(false);
  const [showAbout,setShowAbout]=useState(false);
  const colorRef=useRef(0);
  const inputEl=useRef(null);
  const gameRef=useRef({streak:0,lastOpenDate:null,dailyCompletions:{},dailyBonusClaimed:{},streakMsClaimed:0});

  const addAward=useCallback(function(award){setScore(function(s){return s+award.pts;});setAwards(function(p){return p.concat([award]);});},[]);

  const checkStreak=useCallback(function(cur,lastOpen,msClaimed){
    if(lastOpen===TODAY)return;
    const yest=getYesterday();
    const ns=!lastOpen?1:(lastOpen===yest?cur+1:1);
    const nmc=lastOpen===yest?msClaimed:0;
    gameRef.current.streak=ns;gameRef.current.lastOpenDate=TODAY;gameRef.current.streakMsClaimed=nmc;
    setStreak(ns);
    const milestone=STREAK_MS.find(function(m){return m.days===ns&&m.days>nmc;});
    if(milestone){gameRef.current.streakMsClaimed=milestone.days;setTimeout(function(){addAward({type:'streak',pts:milestone.pts,streak:ns});},1200);}
  },[TODAY,addAward]);

  const checkAndFireNotif=useCallback(function(ns){
    try{
      if(!ns||!ns.enabled)return;
      if(safeNotifPermission()!=='granted')return;
      const today=getToday();
      if(ns.lastFiredDate===today)return;
      const parts=(ns.time||'09:00').split(':');
      const h=parseInt(parts[0],10);const m=parseInt(parts[1],10);
      const now=new Date();const target=new Date();target.setHours(h,m,0,0);
      if(now>=target){
        if(sendNotification('TETRADO','Tetrado today?')){
          const updated=Object.assign({},ns,{lastFiredDate:today});
          setNotifSettings(updated);
          storage.set('tetrado-notif',JSON.stringify(updated)).catch(function(e){return e;});
        }
      }
    }catch(e){return;}
  },[]);

  useEffect(function(){
    (async function(){
      try{const r=await storage.get('tetrado-user');if(r&&r.value)setUser(JSON.parse(r.value));}catch(e){void e;}
      try{
        const r=await storage.get('tetrado-v3');
        if(r&&r.value){
          const d=JSON.parse(r.value);
          setTasks(d.tasks||[]);colorRef.current=d.ci||0;setScore(d.score||0);setDark(d.dark!==false);
          const gd={streak:d.streak||0,lastOpenDate:d.lastOpenDate||null,dailyCompletions:d.dailyCompletions||{},dailyBonusClaimed:d.dailyBonusClaimed||{},streakMsClaimed:d.streakMsClaimed||0};
          gameRef.current=gd;setStreak(gd.streak);
          checkStreak(gd.streak,gd.lastOpenDate,gd.streakMsClaimed);
        }
      }catch(e){void e;}
      try{
        const r=await storage.get('tetrado-notif');
        if(r&&r.value){const ns=JSON.parse(r.value);setNotifSettings(ns);checkAndFireNotif(ns);}
      }catch(e){void e;}
      setLoaded(true);
    })();
  },[]);

  useEffect(function(){
    if(!loaded)return;
    const gd=gameRef.current;
    storage.set('tetrado-v3',JSON.stringify({tasks:tasks,ci:colorRef.current,score:score,dark:dark,streak:gd.streak,lastOpenDate:gd.lastOpenDate,dailyCompletions:gd.dailyCompletions,dailyBonusClaimed:gd.dailyBonusClaimed,streakMsClaimed:gd.streakMsClaimed})).catch(function(e){return e;});
  },[tasks,score,dark,loaded,streak]);

  const saveUser=useCallback(async function(u){setUser(u);await storage.set('tetrado-user',JSON.stringify(u)).catch(function(e){return e;});},[]);
  const saveNotif=useCallback(async function(ns){setNotifSettings(ns);await storage.set('tetrado-notif',JSON.stringify(ns)).catch(function(e){return e;});},[]);

  const showFloat=useCallback(function(pts){
    const id=Date.now()+Math.random();
    setFloatPts(function(p){return p.concat([{id:id,pts:pts}]);});
    setTimeout(function(){setFloatPts(function(p){return p.filter(function(x){return x.id!==id;});});},1200);
  },[]);

  function addTask(){
    if(!input.trim())return;
    const id=String(Date.now());
    const ci=colorRef.current%PIECES.length;colorRef.current++;
    setTasks(function(p){return [{id:id,text:input.trim(),created:TODAY,due:dueDate||TODAY,done:false,ci:ci,category:null}].concat(p);});
    setDropping(id);setTimeout(function(){setDropping(null);},750);
    setInput('');setDueDate('');setDueSelected(false);if(inputEl.current)inputEl.current.focus();
  }

  function completeTask(id,taskName,due){
    setScore(function(s){return s+PTS_TASK;});showFloat(PTS_TASK);
    if(dateDiff(due,TODAY)>0)setTimeout(function(){addAward({type:'early',pts:PTS_EARLY,taskName:taskName});},400);
    const dc=Object.assign({},gameRef.current.dailyCompletions);dc[TODAY]=(dc[TODAY]||0)+1;gameRef.current.dailyCompletions=dc;
    const dbc=gameRef.current.dailyBonusClaimed[TODAY]||[];
    const thresh=DAILY_T.find(function(th){return th.count===dc[TODAY]&&!dbc.includes(th.count);});
    if(thresh){gameRef.current.dailyBonusClaimed[TODAY]=dbc.concat([thresh.count]);setTimeout(function(){addAward({type:'daily',pts:thresh.pts,count:thresh.count,date:TODAY});},800);}
    setClearing(function(p){const n=new Set(p);n.add(id);return n;});
    setTimeout(function(){setTasks(function(p){return p.map(function(t){return t.id===id?Object.assign({},t,{done:true}):t;});});setClearing(function(p){const n=new Set(p);n.delete(id);return n;});setTab('active');},650);
  }

  function removeTask(id){setTasks(function(p){return p.filter(function(t){return t.id!==id;});});}
  function updateCategory(id,key){setTasks(function(p){return p.map(function(t){return t.id===id?Object.assign({},t,{category:key}):t;});});}

  const th=TH(dark);
  const notifOn=notifSettings.enabled&&safeNotifPermission()==='granted';
  const active=tasks.filter(function(t){return !t.done;}).sort(function(a,b){return b.created.localeCompare(a.created);});
  const done=tasks.filter(function(t){return t.done;});
  function buildRows(list){const rows=[];let ld=null;list.forEach(function(t){if(t.created!==ld){rows.push({kind:'sep',date:t.created});ld=t.created;}rows.push({kind:'task',task:t});});return rows;}
  const rows=buildRows(tab==='active'?active:done);

  if(!loaded)return null;
  if(!user)return <LoginScreen onLogin={saveUser}/>;

  return(
    <div className="safe-top" style={{fontFamily:"'Press Start 2P', monospace",background:th.bg,minHeight:'100vh',backgroundImage:'linear-gradient('+th.grid+' 1px,transparent 1px),linear-gradient(90deg,'+th.grid+' 1px,transparent 1px)',backgroundSize:'28px 28px',paddingLeft:'22px',paddingRight:'22px',paddingBottom:'120px',maxWidth:'560px',margin:'0 auto',position:'relative'}}>
      <style>{'@import url(\'https://fonts.googleapis.com/css2?family=Press+Start+2P&family=VT323&display=swap\');*{box-sizing:border-box;}.safe-top{padding-top:max(52px,env(safe-area-inset-top,52px))!important;}@keyframes dropIn{0%{transform:translateY(-130px);opacity:0;}55%{transform:translateY(7px);}75%{transform:translateY(-3px);}100%{transform:translateY(0);opacity:1;}}@keyframes lineClear{0%{transform:scaleY(1);opacity:1;}12%{filter:brightness(5);}40%{transform:scaleY(.55) scaleX(1.04);opacity:.8;filter:brightness(2);}70%{transform:scaleY(.12);opacity:.25;}100%{transform:scaleY(0);opacity:0;margin-bottom:0!important;min-height:0!important;}}@keyframes urgBlink{0%,100%{opacity:.7}50%{opacity:1}}@keyframes coinFall{0%{transform:translateY(0) rotate(0deg);opacity:1;}85%{opacity:.9;}100%{transform:translateY(110vh) rotate(720deg);opacity:0;}}@keyframes floatUp{0%{transform:translateY(0);opacity:1;}100%{transform:translateY(-55px);opacity:0;}}@keyframes certIn{0%{transform:scale(.82);opacity:0;}100%{transform:scale(1);opacity:1;}}@keyframes fadeIn{from{opacity:0;transform:translateY(5px);}to{opacity:1;transform:none;}}.blk.dropping{animation:dropIn .7s cubic-bezier(.22,.61,.36,1) both;}.blk.clearing{animation:lineClear .65s ease-in both;pointer-events:none;overflow:hidden;}.blk{position:relative;margin-bottom:8px;}.blk:hover .acts{opacity:1!important;}.act{background:rgba(0,0,0,0.55);border:1px solid rgba(255,255,255,0.15);color:rgba(255,255,255,0.55);font-family:\'Press Start 2P\',monospace;font-size:6px;padding:5px 7px;cursor:pointer;transition:all .12s;line-height:1;}.act.ok:hover{background:rgba(0,255,100,.25);border-color:rgba(0,255,100,.5);color:#80FF80;}.act.del:hover{background:rgba(255,50,50,.25);border-color:rgba(255,50,50,.5);color:#FF8080;}.drop-btn{background:#00F0F0;border:none;color:#001414;font-family:\'Press Start 2P\',monospace;font-size:8px;padding:0 18px;cursor:pointer;letter-spacing:1px;white-space:nowrap;box-shadow:0 4px 0 #007878;transition:transform .1s,box-shadow .1s;}.drop-btn:hover{background:#80F8F8;}.drop-btn:active{transform:translateY(4px);box-shadow:0 0 0 #007878;}.ti{width:100%;border:1px solid;font-family:\'VT323\',monospace;font-size:22px;padding:10px 12px;outline:none;letter-spacing:1px;}.urgent-blink{animation:urgBlink 1.6s ease-in-out infinite;}.tab-panel{animation:fadeIn .18s ease both;}.cert-card{animation:certIn .3s cubic-bezier(.22,.61,.36,1) both;}.hdr-btn{background:transparent;border:1px solid;font-family:\'Press Start 2P\',monospace;font-size:9px;padding:6px 8px;cursor:pointer;line-height:1;}'}</style>

      {floatPts.map(function(fp){return <div key={fp.id} style={{position:'fixed',top:'42%',left:'50%',transform:'translateX(-50%)',zIndex:200,fontFamily:"'Press Start 2P', monospace",fontSize:'11px',color:th.scoreCol,textShadow:th.scoreGlow,animation:'floatUp 1.1s ease-out both',pointerEvents:'none',letterSpacing:'2px'}}>+{fp.pts}</div>;})}

      {awards.length>0&&<Certificate award={awards[0]} user={user} onDismiss={function(){setAwards(function(p){return p.slice(1);});}}/>}
      {editProfile&&<ProfileModal user={user} dark={dark} onSave={function(u){saveUser(u);setEditProfile(false);}} onClose={function(){setEditProfile(false);}}/>}
      {showNotif&&<NotifModal notifSettings={notifSettings} onSave={saveNotif} onClose={function(){setShowNotif(false);}} dark={dark}/>}
      {songGame&&hint.musical&&<SongGame hint={hint} dark={dark} onClose={function(){setSongGame(false);}} onAward={function(pts){addAward({type:'song',pts:pts,title:'MUSIC MASTER'});showFloat(pts);setSongGame(false);}}/>}
      {showAbout&&<AboutPage user={user} dark={dark} score={score} streak={streak} onEditProfile={function(){setShowAbout(false);setEditProfile(true);}} onClose={function(){setShowAbout(false);}}/>}

      <div style={{padding:'28px 0 14px',borderBottom:'2px solid '+th.hdrBdr,marginBottom:'6px',position:'relative',paddingRight:'140px'}}>
        <div style={{fontSize:'20px',color:th.accent,letterSpacing:'6px',marginBottom:'6px'}}>TETRADO</div>
        <div style={{fontSize:'6px',color:th.accent+'55',letterSpacing:'3px'}}>TASK MACHINE — DROP. STACK. CLEAR.</div>
        <div style={{display:'flex',gap:'18px',marginTop:'10px',fontSize:'7px',color:th.muted,letterSpacing:'1px',alignItems:'center'}}>
          <span>PTS <span style={{color:th.scoreCol,textShadow:th.scoreGlow}}>{fmtScore(score)}</span></span>
          <span>STREAK <span style={{color:th.scoreCol,textShadow:th.scoreGlow}}>{streak}</span></span>
        </div>
        <div style={{position:'absolute',top:'26px',right:0,display:'flex',gap:'6px',alignItems:'center'}}>
          <button className="hdr-btn" onClick={function(){setShowNotif(true);}} title="Daily reminder" style={{background:notifOn?'rgba(0,180,80,0.18)':dark?'rgba(255,255,255,0.08)':'rgba(0,0,0,0.08)',borderColor:notifOn?'#00C850':th.panelBdr,color:notifOn?'#00C850':dark?'#E8F0FF':'#1A1A2E'}}>REM</button>
          <button className="hdr-btn" onClick={function(){setDark(function(d){return !d;});}} title={dark?'Switch to light mode':'Switch to dark mode'} style={dark?{background:'#FFF4CC',borderColor:'#E8A000',color:'#C06800'}:{background:'#1A1640',borderColor:'#5040AA',color:'#9080FF'}}>
            {dark
              ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
              : <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            }
          </button>
          <div style={{cursor:'pointer'}} onClick={function(){setShowAbout(true);}} title="Profile & about">
            <AvatarCanvas grid={user.grid} size={34} style={{border:'2px solid '+th.panelBdr,background:th.inp}}/>
          </div>
        </div>
      </div>

      <div style={{display:'flex',gap:'6px',margin:'16px 0 0'}}>
        {['active','cleared'].map(function(id){const on=tab===id;const count=id==='active'?active.length:done.length;return(
          <button key={id} onClick={function(){setTab(id);}} style={{fontFamily:"'Press Start 2P', monospace",fontSize:'7px',letterSpacing:'1px',padding:'10px 14px',cursor:'pointer',flex:1,border:'none',background:on?th.tabOnBg:th.tabOffBg,color:on?th.tabOn:th.tabOff,borderTop:'2px solid '+(on?th.tabOn:th.panelBdr),borderLeft:'2px solid '+(on?th.tabOn+'80':th.panelBdr),borderRight:'2px solid '+(on?th.tabOff+'CC':th.panelBdr),borderBottom:'2px solid '+(on?th.tabOff+'CC':th.panelBdr)}}>
            {id.toUpperCase()} <span style={{color:th.scoreCol}}>{count}</span>
          </button>
        );})}
      </div>

      {tab==='active'&&<NewTaskPanel
        hint={hint} dark={dark} input={input} dueDate={dueDate} dueSelected={dueSelected} today={TODAY}
        onInput={function(v){setInput(v);setDueSelected(false);setDueDate('');}}
        onSelectDue={function(v){setDueDate(v);setDueSelected(true);}}
        onDrop={addTask}
        onNote={function(){setSongGame(true);}}
        inputRef={inputEl}
        th={TH(dark)}
      />}

      <div key={tab} className="tab-panel">
        {rows.length===0&&<div style={{textAlign:'center',padding:'80px 20px',fontSize:'8px',color:th.accent+'16',lineHeight:3.5,letterSpacing:'2px'}}>{tab==='active'?'BOARD EMPTY':'NO CLEARED LINES'}</div>}
        {rows.map(function(row){
          if(row.kind==='sep'){const isToday=row.date===TODAY;return <div key={'sep-'+row.date} style={{fontSize:'7px',letterSpacing:'2px',padding:'18px 0 10px',marginBottom:'10px',borderBottom:'1px solid '+th.sep,color:isToday?th.lblToday:th.lblPast}}>{isToday?'TODAY':relDate(row.date,TODAY)}</div>;}
          const t=row.task;
          return <TaskBlock key={t.id} t={t} dropping={dropping===t.id} isClearing={clearing.has(t.id)} today={TODAY} dark={dark} onComplete={function(){completeTask(t.id,t.text,t.due);}} onRemove={function(){removeTask(t.id);}} onCategoryChange={function(key){updateCategory(t.id,key);}}/>;
        })}
      </div>
    </div>
  );
}
