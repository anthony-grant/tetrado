import { useState, useEffect, useRef, useCallback } from "react";

const storage = {
  get: async function(key){var v=localStorage.getItem(key);if(v===null)throw new Error('nf');return{value:v};},
  set: async function(key,val){localStorage.setItem(key,String(val));return true;}
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
const COLLAPSE_THRESHOLD=4;

const HINTS=[
  {text:"Let's Tetrado it!",musical:false},
  {text:"To do or Tetrado...",musical:false},
  {text:"Ready, set, Tetrado!",musical:false},
  {text:"Tetrado it to the max!",musical:false},
  {text:"If you do for me, I'll Tetrado for you...",musical:true,answer:"I'll Do for You by Father MC",url:"https://www.youtube.com/watch?v=i_ywhU3BbOk",decoys:["Do It To Me by Lionel Richie","I'll Be There for You by Bon Jovi","Do Me Baby by Prince"]},
  {text:"Tetrado you believe in magic...",musical:true,answer:"Do You Believe in Magic by Lovin' Spoonful",url:"https://youtu.be/JnbfuAcCqpY?si=1uD7lVDBdI4TY8kP",decoys:["Magic by Olivia Newton-John","Believe by Cher","Do You Believe in Love by Huey Lewis"]},
  {text:"Tetrado do do da da da...",musical:true,answer:"De Do Do Do, De Da Da Da by The Police",url:"https://youtu.be/7v2GDbEmjGE?si=fAvJowO62sXwzeFA",decoys:["Da Ya Think I'm Sexy by Rod Stewart","Da Doo Ron Ron by The Crystals","Do Wah Diddy by Manfred Mann"]},
  {text:"Tetrado I do...",musical:true,answer:"Do I Do by Stevie Wonder",url:"https://youtu.be/QGNR-gv0sRI?si=nuKfZMnrRHP4kmlT",decoys:["I Do by 702","Superstition by Stevie Wonder","Do I Do by Lil Mo"]},
  {text:"All I wanna Tetrado is...complete some tasks",musical:true,answer:"All I Wanna Do by Sheryl Crow",url:"https://youtu.be/ClbmWkbocoY?si=Rylc3ZeTR9gSYuwI",decoys:["Wanna Be Startin Somethin by Michael Jackson","All I Want by Kodaline","Everyday People by Sly and The Family Stone"]},
];
function pickHint(){return HINTS[Math.floor(Math.random()*HINTS.length)];}
const SONG_PTS=[50,25,0];

function getToday(){var d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
function getYesterday(){var d=new Date();d.setDate(d.getDate()-1);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
function dateDiff(a,b){return Math.round((new Date(a+'T12:00:00')-new Date(b+'T12:00:00'))/86400000);}
function relDate(d,today){if(d===today)return 'TODAY';var df=dateDiff(today,d);if(df===1)return 'YESTERDAY';if(df<7)return df+'D AGO';return new Date(d+'T12:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric'}).toUpperCase();}
function dueInfo(due,today){var df=dateDiff(due,today);if(df<0)return{label:(-df)+'D OVERDUE',hot:true};if(df===0)return{label:'DUE TODAY',hot:true};if(df===1)return{label:'DUE TOMORROW',hot:false};return{label:'+'+df+'D',hot:false};}
function fmtScore(n){return n>=1000?(n/1000).toFixed(1)+'K':String(n);}
function hashStr(s){var h=5381;for(var i=0;i<s.length;i++)h=(((h<<5)+h)^s.charCodeAt(i))>>>0;return h;}
function seededRand(seed){var s=(seed||1)>>>0;return function(){s=(Math.imul(1664525,s)+1013904223)>>>0;return s/0x100000000;};}
function getTomorrow(){var d=new Date();d.setDate(d.getDate()+1);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}

function safeNotifPermission(){try{if(!('Notification' in window))return'unsupported';return Notification.permission;}catch(e){return'unsupported';}}
async function requestNotifPermission(){try{if(!('Notification' in window))return'unsupported';return await Notification.requestPermission();}catch(e){return'denied';}}
function sendNotification(title,body){try{if(safeNotifPermission()==='granted'){new Notification(title,{body:body,tag:'tetrado-daily'});return true;}}catch(e){return false;}return false;}

function generateAvatar(seed){
  var rng=seededRand(typeof seed==='string'?hashStr(seed):seed);
  var skin=SKINS[Math.floor(rng()*SKINS.length)];var hair=HAIRS[Math.floor(rng()*HAIRS.length)];
  var dk='#0A0A1A',wh='#FEFEFE',lp='#FF4466';
  var G=Array.from({length:24},function(){return Array(24).fill(null);});
  var S=function(r,c,col){if(r>=0&&r<24&&c>=0&&c<24)G[r][c]=col;};
  var bx=function(r1,c1,r2,c2,col){for(var r=r1;r<=r2;r++)for(var c=c1;c<=c2;c++)S(r,c,col);};
  bx(5,4,20,19,skin);
  var hs=Math.floor(rng()*4);
  if(hs===0){bx(0,5,5,18,hair);bx(1,4,5,19,hair);}
  else if(hs===1){bx(3,4,5,19,hair);for(var c=5;c<=17;c+=4)bx(0,c,3,c+1,hair);}
  else if(hs===2){for(var r=0;r<6;r++){var sp=Math.round(8-Math.abs(r-2.5));for(var cc=11-sp;cc<=12+sp;cc++)S(r,cc,hair);}bx(5,4,6,19,hair);}
  else{bx(2,6,5,17,hair);bx(5,3,13,4,hair);bx(5,19,13,20,hair);}
  bx(12,3,14,3,skin);bx(12,20,14,20,skin);
  bx(8,6,8,9,dk);bx(8,14,8,17,dk);
  bx(9,6,11,9,wh);S(10,7,dk);S(10,8,dk);
  bx(9,14,11,17,wh);S(10,15,dk);S(10,16,dk);
  if(rng()>0.48){var gc=HAIRS[Math.floor(rng()*HAIRS.length)];for(var rr=8;rr<=12;rr++){S(rr,5,gc);S(rr,10,gc);S(rr,13,gc);S(rr,18,gc);}for(var cv=5;cv<=10;cv++){S(8,cv,gc);S(12,cv,gc);}for(var cw=13;cw<=18;cw++){S(8,cw,gc);S(12,cw,gc);}S(10,11,gc);S(10,12,gc);}
  S(13,11,skin);S(14,11,skin);S(14,12,skin);
  var ms=Math.floor(rng()*3);
  if(ms===0){bx(16,8,16,15,lp);S(15,8,lp);S(15,15,lp);bx(16,9,16,14,wh);bx(17,8,17,15,lp);S(18,9,lp);S(18,14,lp);}
  else if(ms===1){bx(17,8,17,15,lp);S(16,8,lp);S(16,15,lp);S(18,9,lp);S(18,14,lp);}
  else{bx(16,7,18,16,lp);bx(16,8,17,15,wh);S(17,11,dk);S(17,12,dk);}
  if(rng()>0.5){var b='rgba(255,100,100,0.5)';bx(12,5,13,6,b);bx(12,17,13,18,b);}
  return G;
}

function AvatarCanvas({grid,size,style}){
  size=size||48;style=style||{};
  var ref=useRef(null);
  useEffect(function(){var cv=ref.current;if(!cv||!grid)return;var ctx=cv.getContext('2d');ctx.clearRect(0,0,24,24);for(var r=0;r<24;r++)for(var c=0;c<24;c++){if(grid[r][c]){ctx.fillStyle=grid[r][c];ctx.fillRect(c,r,1,1);}}},[grid]);
  return <canvas ref={ref} width={24} height={24} style={Object.assign({width:size,height:size,imageRendering:'pixelated',display:'block'},style)}/>;
}
function IconCanvas({catKey,size}){
  size=size||20;
  var ref=useRef(null);
  useEffect(function(){var cv=ref.current;var cat=CATEGORIES[catKey];if(!cv||!cat)return;var ctx=cv.getContext('2d');ctx.clearRect(0,0,12,12);cat.px.forEach(function(row,r){Array.from(row).forEach(function(ch,c){if(ch==='#'){ctx.fillStyle=cat.col;ctx.fillRect(c,r,1,1);}});});},[catKey]);
  return <canvas ref={ref} width={12} height={12} style={{width:size,height:size,imageRendering:'pixelated',display:'block'}}/>;
}

var TH=function(dark){return dark?{
  bg:'#06060F',grid:'rgba(0,240,240,0.03)',fg:'#E8F0FF',accent:'#00F0F0',
  muted:'rgba(255,255,255,0.22)',panel:'rgba(0,6,18,0.92)',panelBdr:'rgba(0,240,240,0.18)',
  inp:'rgba(0,240,240,0.04)',inpBdr:'rgba(0,240,240,0.18)',inpFg:'#E8F0FF',
  tabOn:'#00F0F0',tabOnBg:'rgba(0,240,240,0.1)',tabOff:'rgba(0,240,240,0.28)',tabOffBg:'rgba(0,0,0,0.3)',
  sep:'rgba(0,240,240,0.08)',lblToday:'#00F0F0',lblPast:'rgba(0,240,240,0.28)',hdrBdr:'rgba(0,240,240,0.15)',
  scoreCol:'#FFD700',scoreGlow:'0 0 8px rgba(255,215,0,0.55)',blkBg:function(c){return c.main+'14';},blkTxt:function(c){return c.main;},blkMeta:function(c){return c.main+'88';}
}:{
  bg:'#EEE9DF',grid:'rgba(0,0,0,0.04)',fg:'#1A1A2E',accent:'#007878',
  muted:'rgba(0,0,0,0.32)',panel:'rgba(255,255,255,0.88)',panelBdr:'rgba(0,150,150,0.22)',
  inp:'rgba(0,0,0,0.04)',inpBdr:'rgba(0,150,150,0.22)',inpFg:'#1A1A2E',
  tabOn:'#007878',tabOnBg:'rgba(0,150,150,0.1)',tabOff:'rgba(0,100,100,0.3)',tabOffBg:'rgba(0,0,0,0.05)',
  sep:'rgba(0,150,150,0.1)',lblToday:'#007878',lblPast:'rgba(0,100,100,0.38)',hdrBdr:'rgba(0,150,150,0.15)',
  scoreCol:'#8A5A00',scoreGlow:'none',blkBg:function(c){return c.lbg;},blkTxt:function(c){return c.ltx;},blkMeta:function(c){return c.ltx+'AA';}
};};

function NoteButton({onActivate}){
  return(
    <button onMouseDown={function(e){e.preventDefault();}} onClick={function(e){e.stopPropagation();onActivate();}} onTouchEnd={function(e){e.preventDefault();e.stopPropagation();onActivate();}} title="Secret mode" style={{flexShrink:0,background:'rgba(255,215,0,0.18)',border:'1px solid rgba(255,215,0,0.45)',color:'#FFD700',fontSize:'18px',width:'44px',alignSelf:'stretch',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',lineHeight:1,marginBottom:'10px'}}>&#9835;</button>
  );
}

function SongGame({hint,onClose,onAward,dark}){
  var t=TH(dark);
  var [opts]=useState(function(){var all=[hint.answer].concat(hint.decoys);for(var i=all.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var tmp=all[i];all[i]=all[j];all[j]=tmp;}return all;});
  var [attempts,setAttempts]=useState(0);
  var [chosen,setChosen]=useState(null);
  var [solved,setSolved]=useState(false);
  function guess(opt){if(solved||attempts>=3)return;var na=attempts+1;setAttempts(na);setChosen(opt);if(opt===hint.answer){setSolved(true);var pts=SONG_PTS[attempts]||0;if(pts>0)onAward(pts);}else if(na>=3){setSolved(true);}}
  var correct=chosen===hint.answer;
  var pts=solved&&correct?SONG_PTS[Math.min(attempts-1,2)]:null;
  return(
    <div style={{position:'fixed',inset:0,zIndex:600,background:'rgba(0,0,0,0.85)',display:'flex',alignItems:'center',justifyContent:'center',padding:'20px',fontFamily:"'Press Start 2P', monospace"}} onClick={onClose}>
      <div style={{background:t.bg,border:'2px solid '+t.panelBdr,padding:'22px',maxWidth:'380px',width:'100%'}} onClick={function(e){e.stopPropagation();}}>
        <div style={{fontSize:'7px',color:'#FFD700',letterSpacing:'2px',marginBottom:'6px'}}>SECRET GAME MODE</div>
        <div style={{fontSize:'6px',color:t.muted,letterSpacing:'1px',marginBottom:'18px'}}>WHICH SONG IS TETRADO REALLY SINGING?</div>
        <div style={{fontFamily:"'VT323', monospace",fontSize:'20px',color:t.accent,lineHeight:1.5,marginBottom:'20px',padding:'12px',background:t.inp,border:'1px solid '+t.panelBdr}}>{hint.text} <span style={{color:'#FFD700'}}>&#9835;</span></div>
        {!solved&&<div style={{fontSize:'6px',color:t.muted,letterSpacing:'1px',marginBottom:'10px'}}>{'ATTEMPT '+(attempts+1)+' OF 3  —  +'+(SONG_PTS[attempts]||0)+' PTS IF CORRECT'}</div>}
        <div style={{display:'flex',flexDirection:'column',gap:'8px',marginBottom:'16px'}}>
          {opts.map(function(opt){
            var isChosen=chosen===opt,isAnswer=opt===hint.answer;
            var bg=t.inp,border='1px solid '+t.panelBdr,col=t.inpFg,cursor='pointer';
            if(solved&&isAnswer){bg='rgba(0,200,80,0.15)';border='2px solid #00C850';col='#00C850';}
            else if(isChosen&&!isAnswer){bg='rgba(220,50,50,0.12)';border='2px solid #CC3333';col='#CC3333';}
            else if(solved){col=t.muted;cursor='default';}
            return <button key={opt} onClick={function(){guess(opt);}} disabled={solved} style={{background:bg,border:border,color:col,fontFamily:"'VT323', monospace",fontSize:'18px',padding:'10px 14px',cursor:cursor,textAlign:'left',lineHeight:1.4,letterSpacing:'1px'}}>{opt}</button>;
          })}
        </div>
        {solved&&<div style={{marginBottom:'16px'}}>
          {correct?<div style={{fontFamily:"'VT323', monospace",fontSize:'20px',color:'#00C850',lineHeight:1.6}}>CORRECT! {pts>0&&<span style={{color:'#FFD700'}}>+{pts} PTS AWARDED</span>}{pts===0&&<span style={{color:t.muted}}>GOOD EAR!</span>}</div>:<div style={{fontFamily:"'VT323', monospace",fontSize:'20px',color:'#CC3333',lineHeight:1.6}}>THE ANSWER WAS: <span style={{color:t.inpFg}}>{hint.answer}</span></div>}
          <a href={hint.url} target="_blank" rel="noreferrer" style={{display:'inline-block',marginTop:'10px',fontFamily:"'Press Start 2P', monospace",fontSize:'6px',color:t.accent,textDecoration:'none',border:'1px solid '+t.panelBdr,padding:'8px 12px'}}>LISTEN ON YOUTUBE &#9654;</a>
        </div>}
        <button onClick={onClose} style={{width:'100%',background:'transparent',border:'1px solid '+t.panelBdr,color:t.muted,fontFamily:"'Press Start 2P', monospace",fontSize:'6px',padding:'10px',cursor:'pointer'}}>{solved?'CLOSE':'SKIP'}</button>
      </div>
    </div>
  );
}

function NotifModal({notifSettings,onSave,onClose,dark}){
  var t=TH(dark);
  var [enabled,setEnabled]=useState(notifSettings.enabled||false);
  var [time,setTime]=useState(notifSettings.time||'09:00');
  var [perm,setPerm]=useState(function(){return safeNotifPermission();});
  var [testSent,setTestSent]=useState(false);
  function handleAllow(){requestNotifPermission().then(function(result){setPerm(result);if(result==='granted')setEnabled(true);});}
  function handleTest(){if(sendNotification('TETRADO','Tetrado today?')){setTestSent(true);setTimeout(function(){setTestSent(false);},2500);}}
  function handleSave(){onSave({enabled:enabled&&perm==='granted',time:time,lastFiredDate:notifSettings.lastFiredDate||null});onClose();}
  var isGranted=perm==='granted';
  var permLabel=perm==='granted'?'NOTIFICATIONS ALLOWED':perm==='denied'?'BLOCKED — ENABLE IN BROWSER SETTINGS':perm==='default'?'PERMISSION REQUIRED':'INSTALL AS PWA TO ENABLE';
  var permColor=perm==='granted'?'rgba(80,220,80,0.85)':perm==='denied'?'rgba(255,80,80,0.8)':perm==='default'?'rgba(240,160,0,0.85)':t.muted;
  return(
    <div style={{position:'fixed',inset:0,zIndex:550,background:'rgba(0,0,0,0.82)',display:'flex',alignItems:'center',justifyContent:'center',padding:'20px',fontFamily:"'Press Start 2P', monospace"}} onClick={onClose}>
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
            {[false,true].map(function(val){var isOn=enabled===val;var lbl=val?'ON':'OFF';var col=val?'#00F000':'rgba(255,80,80,0.7)';return <button key={lbl} onClick={function(){val&&!isGranted?handleAllow():setEnabled(val);}} style={{flex:1,fontFamily:"'Press Start 2P', monospace",fontSize:'8px',padding:'10px',cursor:'pointer',border:'none',background:isOn?col+'18':t.inp,color:isOn?col:t.muted,borderTop:'3px solid '+(isOn?col:t.panelBdr),borderLeft:'3px solid '+(isOn?col+'80':t.panelBdr),borderRight:'3px solid '+(isOn?'rgba(0,0,0,0.4)':t.panelBdr),borderBottom:'3px solid '+(isOn?'rgba(0,0,0,0.4)':t.panelBdr),letterSpacing:'2px'}}>{lbl}</button>;})}
          </div>
        </div>
        {enabled&&isGranted&&<div style={{marginBottom:'16px'}}>
          <div style={{fontSize:'6px',color:t.muted,letterSpacing:'2px',marginBottom:'8px'}}>NOTIFY AT</div>
          <input type="time" value={time} onChange={function(e){setTime(e.target.value);}} style={{width:'100%',background:t.inp,border:'1px solid '+t.inpBdr,color:t.inpFg,fontFamily:"'VT323', monospace",fontSize:'26px',padding:'8px 12px',outline:'none',colorScheme:dark?'dark':'light',letterSpacing:'2px'}}/>
        </div>}
        {isGranted&&enabled&&<button onClick={handleTest} style={{width:'100%',marginBottom:'12px',background:'transparent',border:'1px solid '+t.panelBdr,color:testSent?'#80FF80':t.accent,fontFamily:"'Press Start 2P', monospace",fontSize:'6px',padding:'9px',cursor:'pointer',letterSpacing:'1px'}}>{testSent?'SENT!':'SEND TEST NOTIFICATION'}</button>}
        <div style={{fontFamily:"'VT323', monospace",fontSize:'14px',color:t.muted,lineHeight:1.6,marginBottom:'16px',padding:'10px',background:t.inp,border:'1px solid '+t.panelBdr}}>{isGranted?'Opens the app past your set time? Reminder fires immediately. Install as PWA for true background notifications.':'Install TETRADO as a PWA on your home screen to enable daily reminders.'}</div>
        <div style={{display:'flex',gap:'8px'}}>
          <button onClick={onClose} style={{flex:1,background:'transparent',border:'1px solid '+t.panelBdr,color:t.muted,fontFamily:"'Press Start 2P', monospace",fontSize:'6px',padding:'10px',cursor:'pointer'}}>CANCEL</button>
          <button onClick={handleSave} style={{flex:1,background:t.accent,border:'none',color:'#001414',fontFamily:"'Press Start 2P', monospace",fontSize:'6px',padding:'10px',cursor:'pointer'}}>SAVE</button>
        </div>
      </div>
    </div>
  );
}

function CategoryPicker({currentCat,onSelect,onClose,dark}){
  var t=TH(dark);
  return(
    <div style={{position:'fixed',inset:0,zIndex:400,background:'rgba(0,0,0,0.75)',display:'flex',alignItems:'center',justifyContent:'center',padding:'20px',fontFamily:"'Press Start 2P', monospace"}} onClick={onClose}>
      <div style={{background:t.bg,border:'2px solid '+t.panelBdr,padding:'18px',maxWidth:'340px',width:'100%'}} onClick={function(e){e.stopPropagation();}}>
        <div style={{fontSize:'6px',color:t.accent,letterSpacing:'2px',marginBottom:'14px'}}>SELECT CATEGORY</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4, 1fr)',gap:'8px',marginBottom:'12px'}}>
          {CAT_KEYS.map(function(key){var cat=CATEGORIES[key];var on=currentCat===key;return(
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
  var name=user?user.username:'PLAYER';
  var coins=Array.from({length:22},function(_,i){return{id:i,left:(4+(i*4.1)%90)+'%',delay:(i*0.09)%1.6+'s',dur:1.4+(i*0.08)%0.9+'s'};});
  var title,msg;
  if(award.type==='early'){title='AHEAD OF SCHEDULE';msg=(award.taskName||'TASK').substring(0,22).toUpperCase()+' COMPLETED IN RECORD TIME—CONGRATULATIONS '+name+'!';}
  else if(award.type==='daily'){var ds=new Date(award.date+'T12:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric'}).toUpperCase();title=award.count+'x COMBO CLEAR';msg='ALL '+award.count+' TASKS COMPLETED FOR '+ds+'—WELL DONE '+name+'!';}
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
  var [username,setUsername]=useState('');
  var [grid,setGrid]=useState(function(){return generateAvatar(Math.floor(Math.random()*0xFFFFFF));});
  function regen(){setGrid(generateAvatar(Math.floor(Math.random()*0xFFFFFF)));}
  function submit(){if(username.trim())onLogin({username:username.trim(),grid:grid,seed:0});}
  var ok=username.trim().length>0;
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
        <button onClick={submit} disabled={!ok} style={{background:ok?'#00F0F0':'rgba(0,240,240,0.12)',border:'none',color:ok?'#001414':'rgba(0,240,240,0.28)',fontFamily:"'Press Start 2P', monospace",fontSize:'9px',padding:'12px 28px',cursor:ok?'pointer':'default',letterSpacing:'1px',boxShadow:ok?'0 4px 0 #007878':'none'}}>CREATE NEW TASK</button>
      </div>
    </div>
  );
}

function ProfileModal({user,onSave,onClose,dark}){
  var t=TH(dark);
  var [name,setName]=useState(user.username);
  var [grid,setGrid]=useState(user.grid);
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

// Settings page
function SettingsPage({notifSettings,onSaveNotif,dark,onToggleDark,onClose}){
  var t=TH(dark);
  var [showNotifSub,setShowNotifSub]=useState(false);
  var notifOn=notifSettings.enabled&&safeNotifPermission()==='granted';
  return(
    <div style={{position:'fixed',inset:0,zIndex:500,background:t.bg,overflowY:'auto',fontFamily:"'Press Start 2P', monospace",display:'flex',flexDirection:'column'}}>
      {showNotifSub&&<NotifModal notifSettings={notifSettings} onSave={onSaveNotif} onClose={function(){setShowNotifSub(false);}} dark={dark}/>}
      <div className="page-safe-hdr" style={{padding:'0 22px 16px',borderBottom:'2px solid '+t.hdrBdr,flexShrink:0,display:'flex',alignItems:'flex-end',justifyContent:'space-between'}}>
        <div style={{fontSize:'8px',color:t.accent,letterSpacing:'3px'}}>SETTINGS</div>
        <button onClick={onClose} style={{background:'transparent',border:'1px solid '+t.panelBdr,color:t.muted,fontFamily:"'Press Start 2P', monospace",fontSize:'6px',padding:'8px 12px',cursor:'pointer'}}>CLOSE</button>
      </div>

      {/* Theme */}
      <div style={{padding:'22px 22px 18px',borderBottom:'1px solid '+t.sep}}>
        <div style={{fontSize:'6px',color:t.muted,letterSpacing:'2px',marginBottom:'14px'}}>THEME</div>
        <div style={{display:'flex',gap:'8px'}}>
          {[{label:'DARK',icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>,val:true},{label:'LIGHT',icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>,val:false}].map(function(opt){
            var on=dark===opt.val;
            var style=on?(opt.val?{background:'#1A1640',borderColor:'#5040AA',color:'#9080FF'}:{background:'#FFF4CC',borderColor:'#E8A000',color:'#C06800'}):{background:'transparent',borderColor:t.panelBdr,color:t.muted};
            return <button key={opt.label} onClick={function(){if(dark!==opt.val)onToggleDark();}} style={Object.assign({flex:1,fontFamily:"'Press Start 2P', monospace",fontSize:'7px',padding:'12px 8px',cursor:'pointer',border:'2px solid',display:'flex',alignItems:'center',justifyContent:'center',gap:'8px',letterSpacing:'1px'},style)}>{opt.icon}{opt.label}</button>;
          })}
        </div>
      </div>

      {/* Notifications */}
      <div style={{padding:'22px 22px 18px',borderBottom:'1px solid '+t.sep}}>
        <div style={{fontSize:'6px',color:t.muted,letterSpacing:'2px',marginBottom:'14px'}}>NOTIFICATIONS</div>
        <button onClick={function(){setShowNotifSub(true);}} style={{width:'100%',display:'flex',alignItems:'center',justifyContent:'space-between',background:t.inp,border:'1px solid '+t.panelBdr,color:notifOn?'#00C850':t.fg,fontFamily:"'Press Start 2P', monospace",fontSize:'7px',padding:'14px 16px',cursor:'pointer',letterSpacing:'1px'}}>
          <span>DAILY REMINDER</span>
          <span style={{fontSize:'9px',color:notifOn?'#00C850':t.muted}}>{notifOn?'ON ●':'OFF ○'}</span>
        </button>
      </div>

      <div style={{flex:1}}/>
    </div>
  );
}

// About / Profile page — nav hub
function AboutPage({user,dark,score,streak,hasUpdate,onEditProfile,onOpenSettings,onClose}){
  var t=TH(dark);
  var name=user?user.username:'PLAYER';
  var navRows=[
    {label:'EDIT PROFILE',icon:'◈',action:onEditProfile},
    {label:'SETTINGS',icon:'⚙',action:onOpenSettings},
  ];
  if(hasUpdate){navRows.push({label:'UPDATE TETRADO',icon:'●',action:function(){window.location.reload();},update:true});}
  return(
    <div style={{position:'fixed',inset:0,zIndex:500,background:t.bg,overflowY:'auto',fontFamily:"'Press Start 2P', monospace",display:'flex',flexDirection:'column'}}>
      <div className="page-safe-hdr" style={{padding:'0 22px 16px',borderBottom:'2px solid '+t.hdrBdr,flexShrink:0,display:'flex',alignItems:'flex-end',justifyContent:'space-between'}}>
        <div style={{fontSize:'8px',color:t.accent,letterSpacing:'3px'}}>PROFILE</div>
        <button onClick={onClose} style={{background:'transparent',border:'1px solid '+t.panelBdr,color:t.muted,fontFamily:"'Press Start 2P', monospace",fontSize:'6px',padding:'8px 12px',cursor:'pointer',letterSpacing:'1px'}}>CLOSE</button>
      </div>

      <div style={{padding:'32px 22px 24px',borderBottom:'1px solid '+t.sep,display:'flex',flexDirection:'column',alignItems:'center',gap:'16px',flexShrink:0}}>
        <div style={{padding:'10px',background:t.inp,border:'2px solid '+t.panelBdr,cursor:'pointer'}} onClick={onEditProfile}><AvatarCanvas grid={user.grid} size={96}/></div>
        <div style={{fontSize:'14px',color:t.accent,letterSpacing:'4px'}}>{name}</div>
      </div>

      <div style={{padding:'20px 22px',borderBottom:'1px solid '+t.sep,display:'flex',gap:'12px',flexShrink:0}}>
        {[{label:'POINTS',val:score>=1000?(score/1000).toFixed(1)+'K':String(score)},{label:'DAY STREAK',val:String(streak)}].map(function(s){return(
          <div key={s.label} style={{flex:1,background:t.inp,border:'1px solid '+t.panelBdr,padding:'14px 12px',textAlign:'center'}}>
            <div style={{fontSize:'18px',color:t.scoreCol,textShadow:t.scoreGlow,marginBottom:'8px',fontFamily:"'VT323', monospace",letterSpacing:'2px'}}>{s.val}</div>
            <div style={{fontSize:'5px',color:t.muted,letterSpacing:'1px'}}>{s.label}</div>
          </div>
        );})}
      </div>

      {/* Nav rows */}
      <div style={{padding:'12px 22px',flexShrink:0}}>
        {navRows.map(function(row){return(
          <button key={row.label} onClick={row.action} style={{width:'100%',display:'flex',alignItems:'center',justifyContent:'space-between',background:row.update?'rgba(255,50,50,0.12)':'transparent',border:'none',borderBottom:'1px solid '+t.sep,color:row.update?'#FF4444':t.fg,fontFamily:"'Press Start 2P', monospace",fontSize:'7px',padding:'16px 4px',cursor:'pointer',letterSpacing:'1px'}}>
            <span style={{display:'flex',alignItems:'center',gap:'12px'}}><span style={{color:row.update?'#FF4444':t.accent,fontSize:'12px'}}>{row.icon}</span>{row.label}</span>
            <span style={{color:row.update?'#FF4444':t.muted,fontSize:'10px'}}>›</span>
          </button>
        );})}
      </div>

      <div style={{flex:1}}/>

      <div style={{padding:'28px 22px 36px',borderTop:'1px solid '+t.sep,flexShrink:0}}>
        <div style={{marginBottom:'18px',textAlign:'center'}}>
          <div style={{fontSize:'5px',color:t.muted,letterSpacing:'2px',marginBottom:'10px'}}>VERSION 1.0.0</div>
          <div style={{fontFamily:"'VT323', monospace",fontSize:'16px',color:t.muted,letterSpacing:'1px',lineHeight:1.8}}>
            Created by{' '}<a href="https://buymeacoffee.com/argstudios" target="_blank" rel="noreferrer" style={{color:t.accent,textDecoration:'none',borderBottom:'1px solid '+t.accent}}>Anthony Grant</a>
          </div>
        </div>
        <a href="https://buymeacoffee.com/argstudios" target="_blank" rel="noreferrer" style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'10px',background:'#FFDD00',border:'none',padding:'16px 20px',cursor:'pointer',textDecoration:'none',width:'100%'}}>
          <span style={{fontSize:'20px'}}>☕</span>
          <span style={{fontFamily:"'Press Start 2P', monospace",fontSize:'7px',color:'#000000',letterSpacing:'1px'}}>BUY ME A COFFEE</span>
        </a>
      </div>
    </div>
  );
}

// Task block with swipe, drag handle, and inline edit
function TaskBlock({t,dropping,isClearing,today,dark,onComplete,onRemove,onCategoryChange,onDragStart,isDragging,editingId,onEditSave,onEditCancel}){
  var [showPicker,setShowPicker]=useState(false);
  var [swipeX,setSwipeX]=useState(0); // px translation
  var [swiping,setSwiping]=useState(false);
  var swipeRef=useRef(null);
  var isEditing=editingId===t.id;
  var [editText,setEditText]=useState(t.text);
  var [editDue,setEditDue]=useState(t.due||'');
  var th=TH(dark);var c=PIECES[t.ci%PIECES.length];
  var cat=t.category?CATEGORIES[t.category]:null;
  var di=!t.done?dueInfo(t.due,today):null;
  var txtCol=th.blkTxt(c);var metaCol=th.blkMeta(c);
  var bdrHi=dark?c.hi:c.main;var bdrLo=dark?c.lo:c.ltx;
  var SWIPE_THRESHOLD=72;

  function onTouchStart(e){
    if(t.done)return;
    swipeRef.current={x:e.touches[0].clientX,y:e.touches[0].clientY,moved:false};
    setSwiping(false);
  }
  function onTouchMove(e){
    if(!swipeRef.current||t.done)return;
    var dx=e.touches[0].clientX-swipeRef.current.x;
    var dy=e.touches[0].clientY-swipeRef.current.y;
    if(!swipeRef.current.moved&&Math.abs(dy)>Math.abs(dx))return; // vertical scroll wins
    swipeRef.current.moved=true;
    var clamped=Math.max(-SWIPE_THRESHOLD*1.3,Math.min(SWIPE_THRESHOLD*1.3,dx));
    setSwipeX(clamped);setSwiping(true);
  }
  function onTouchEnd(){
    if(!swipeRef.current||t.done){swipeRef.current=null;setSwipeX(0);setSwiping(false);return;}
    if(swipeX<=-SWIPE_THRESHOLD){onComplete();}
    else if(swipeX>=SWIPE_THRESHOLD&&!isEditing){setEditText(t.text);setEditDue(t.due||today);onEditSave(t.id,'__open__',t.due);}
    swipeRef.current=null;
    setSwipeX(0);setSwiping(false);
  }

  var showComplete=swipeX<-20;
  var showEdit=swipeX>20;

  return(
    <>
      {showPicker&&<CategoryPicker currentCat={t.category||null} onSelect={function(key){onCategoryChange(key);}} onClose={function(){setShowPicker(false);}} dark={dark}/>}
      <div className={'blk'+(dropping?' dropping':'')+(isClearing?' clearing':'')+(isDragging?' dragging':'')}
        style={{userSelect:'none',WebkitUserSelect:'none',position:'relative',overflow:'hidden'}}>
        {/* Swipe action backgrounds */}
        {!t.done&&<div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'space-between',pointerEvents:'none'}}>
          <div style={{width:'72px',height:'100%',background:'rgba(0,200,80,0.22)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'22px',opacity:showEdit?1:0,transition:'opacity .1s'}}>✏️</div>
          <div style={{width:'72px',height:'100%',background:'rgba(80,220,80,0.22)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'22px',opacity:showComplete?1:0,transition:'opacity .1s'}}>✅</div>
        </div>}
        <div
          onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
          style={{display:'flex',minHeight:'80px',background:th.blkBg(c),borderTop:'3px solid '+bdrHi,borderLeft:'3px solid '+bdrHi+'70',borderRight:'3px solid '+bdrLo+'CC',borderBottom:'3px solid '+bdrLo+'CC',position:'relative',opacity:t.done?0.42:isDragging?0.65:1,transform:swiping?'translateX('+swipeX+'px)':'translateX(0)',transition:swiping?'none':'transform .2s ease'}}>
          {[{t:0,l:0},{t:0,r:0},{b:0,l:0},{b:0,r:0}].map(function(p,j){return <span key={j} style={{position:'absolute',width:'5px',height:'5px',background:th.bg,top:p.t!==undefined?0:'auto',bottom:p.b!==undefined?0:'auto',left:p.l!==undefined?0:'auto',right:p.r!==undefined?0:'auto'}}/>;})}
          {/* Category icon */}
          <div onClick={function(){if(!t.done)setShowPicker(true);}} style={{width:'40px',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',borderRight:'1px solid '+(cat?cat.col+'35':(dark?'rgba(255,255,255,0.06)':'rgba(0,0,0,0.08)')),cursor:t.done?'default':'pointer',background:cat?cat.col+'0C':'transparent'}}>
            {cat?<IconCanvas catKey={t.category} size={20}/>:<span style={{color:txtCol+'22',fontSize:'16px',lineHeight:1,fontFamily:'monospace',userSelect:'none'}}>+</span>}
          </div>
          {/* Content */}
          <div style={{flex:1,padding:'11px 8px 10px 10px',display:'flex',flexDirection:'column',justifyContent:'space-between'}}>
            <div style={{fontFamily:"'VT323', monospace",fontSize:'23px',color:txtCol,letterSpacing:'1px',lineHeight:1.3,marginBottom:'5px',wordBreak:'break-word',textDecoration:t.done?'line-through':'none'}}>{t.text}</div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',fontSize:'6px',letterSpacing:'1px',color:metaCol}}>
              <span>{relDate(t.created,today)}</span>
              {di&&<span className={di.hot?'urgent-blink':''} style={{padding:'2px 7px',background:di.hot?(dark?'rgba(255,40,40,0.2)':'rgba(180,0,0,0.12)'):'rgba(0,0,0,0.1)',color:di.hot?(dark?'#FF8888':c.ltx):metaCol}}>{di.label}</span>}
              {t.done&&<span style={{color:dark?'rgba(80,255,80,0.5)':c.ltx+'88'}}>CLEARED</span>}
            </div>
          </div>
          {/* Right side: drag handle + delete */}
          <div style={{width:'36px',flexShrink:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'space-between',padding:'8px 4px',borderLeft:'1px solid '+(dark?'rgba(255,255,255,0.05)':'rgba(0,0,0,0.06)')}}>
            {!t.done&&<div
              onTouchStart={function(e){e.stopPropagation();onDragStart(t.id,e.touches[0].clientY);}}
              onMouseDown={function(e){e.stopPropagation();onDragStart(t.id,e.clientY);}}
              style={{cursor:'grab',padding:'4px',color:metaCol,fontSize:'14px',lineHeight:1,userSelect:'none',touchAction:'none'}}
            >⠿</div>}
            {t.done&&<button onClick={onRemove} style={{background:'transparent',border:'none',color:metaCol,fontSize:'14px',cursor:'pointer',padding:'4px',lineHeight:1}}>✕</button>}
          </div>
        </div>
        {/* Inline edit row */}
        {isEditing&&<div style={{background:th.panel,border:'2px solid '+th.panelBdr,borderTop:'none',padding:'12px',animation:'fadeIn .15s ease both'}}>
          <input value={editText} onChange={function(e){setEditText(e.target.value);}} style={{width:'100%',background:th.inp,border:'1px solid '+th.inpBdr,color:th.inpFg,fontFamily:"'VT323', monospace",fontSize:'20px',padding:'8px 10px',outline:'none',letterSpacing:'1px',marginBottom:'8px'}}/>
          <div style={{display:'flex',gap:'6px',alignItems:'center'}}>
            <input type="date" value={editDue} onChange={function(e){setEditDue(e.target.value);}} style={{flex:1,background:th.inp,border:'1px solid '+th.inpBdr,color:th.inpFg,fontFamily:"'VT323', monospace",fontSize:'16px',padding:'8px 10px',outline:'none',colorScheme:dark?'dark':'light'}}/>
            <button onClick={function(){onEditSave(t.id,editText,editDue);}} style={{background:th.accent,border:'none',color:'#001414',fontFamily:"'Press Start 2P', monospace",fontSize:'6px',padding:'10px 12px',cursor:'pointer'}}>SAVE</button>
            <button onClick={onEditCancel} style={{background:'transparent',border:'1px solid '+th.panelBdr,color:th.muted,fontFamily:"'Press Start 2P', monospace",fontSize:'6px',padding:'10px',cursor:'pointer'}}>✕</button>
          </div>
        </div>}
      </div>
    </>
  );
}

function NewTaskPanel({hint,dark,input,dueDate,dueSelected,today,onInput,onSelectDue,onDrop,onNote,inputRef,th,panelRef}){
  var tomorrow=getTomorrow();
  var hasText=input.trim().length>0;
  var quickOpts=[{label:'TODAY',val:today},{label:'TOMORROW',val:tomorrow},{label:'NO DATE',val:''}];
  var isCustom=dueSelected&&dueDate&&dueDate!==today&&dueDate!==tomorrow;
  return(
    <div ref={panelRef} style={{margin:'18px 0'}}>
      <div style={{fontSize:'7px',letterSpacing:'2px',padding:'18px 0 10px',marginBottom:'10px',borderBottom:'1px solid '+th.sep,color:th.lblToday}}>NEW TASK</div>
      <div style={{background:th.panel,border:'2px solid '+th.panelBdr,padding:'14px'}}>
        <div style={{position:'relative',display:'flex',gap:'0',marginBottom:'12px'}}>
          <input ref={inputRef} className="ti" placeholder={hint.text} value={input}
            onChange={function(e){onInput(e.target.value);}}
            onKeyDown={function(e){if(e.key==='Enter'&&hasText&&dueSelected)onDrop();}}
            style={{flex:1,background:th.inp,borderColor:th.inpBdr,color:th.inpFg}}/>
        </div>
        {hasText&&(
          <div style={{animation:'fadeIn .18s ease both'}}>
            <div style={{fontSize:'6px',color:th.accent,letterSpacing:'2px',marginBottom:'10px'}}>WHEN IS IT DUE?</div>
            <div style={{display:'flex',gap:'6px',flexWrap:'wrap',marginBottom:'14px'}}>
              {quickOpts.map(function(opt){
                var chosen=opt.val===''?(dueSelected&&dueDate===''):(dueDate===opt.val&&dueSelected);
                return <button key={opt.label} onClick={function(){onSelectDue(opt.val);}} style={{fontFamily:"'Press Start 2P', monospace",fontSize:'6px',padding:'10px 12px',cursor:'pointer',border:'2px solid '+(chosen?th.tabOn:th.panelBdr),background:chosen?th.tabOnBg:th.inp,color:chosen?th.tabOn:th.muted,letterSpacing:'1px',transition:'all .12s'}}>{opt.label}</button>;
              })}
              <input type="date" value={isCustom?dueDate:''} onChange={function(e){if(e.target.value)onSelectDue(e.target.value);}}
                style={{fontFamily:"'Press Start 2P', monospace",fontSize:'6px',padding:'10px',cursor:'pointer',border:'2px solid '+(isCustom?th.tabOn:th.panelBdr),background:isCustom?th.tabOnBg:th.inp,color:isCustom?th.tabOn:th.inpFg,colorScheme:dark?'dark':'light',flex:1,minWidth:'130px'}}/>
            </div>
            <button className="drop-btn" onClick={onDrop} disabled={!dueSelected}
              style={{width:'100%',height:'52px',fontSize:'10px',opacity:dueSelected?1:0.35,cursor:dueSelected?'pointer':'default',boxShadow:dueSelected?'0 4px 0 #007878':'none',letterSpacing:'2px'}}>
              DROP ▼
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Tetrado(){
  var TODAY=getToday();
  var [user,setUser]=useState(null);
  var [tasks,setTasks]=useState([]);
  var [score,setScore]=useState(0);
  var [streak,setStreak]=useState(0);
  var [dark,setDark]=useState(true);
  var [tab,setTab]=useState('active');
  var [input,setInput]=useState('');
  var [dueDate,setDueDate]=useState('');
  var [dueSelected,setDueSelected]=useState(false);
  var [loaded,setLoaded]=useState(false);
  var [dropping,setDropping]=useState(null);
  var [clearing,setClearing]=useState(new Set());
  var [awards,setAwards]=useState([]);
  var [editProfile,setEditProfile]=useState(false);
  var [showNotif,setShowNotif]=useState(false);
  var [showSettings,setShowSettings]=useState(false);
  var [notifSettings,setNotifSettings]=useState({enabled:false,time:'09:00',lastFiredDate:null});
  var [floatPts,setFloatPts]=useState([]);
  var [hint]=useState(function(){return pickHint();});
  var [songGame,setSongGame]=useState(false);
  var [showAbout,setShowAbout]=useState(false);
  var [collapsedDates,setCollapsedDates]=useState(new Set());
  var [editingId,setEditingId]=useState(null);
  var [showFab,setShowFab]=useState(false);
  // Drag state
  var [draggingId,setDraggingId]=useState(null);
  var [orderedActiveIds,setOrderedActiveIds]=useState([]);
  var [hasUpdate,setHasUpdate]=useState(false);
  var APP_VERSION='1.0.0';

  // Check for updates by comparing stored version
  useEffect(function(){
    try{
      var stored=localStorage.getItem('tetrado-version');
      if(stored&&stored!==APP_VERSION)setHasUpdate(true);
      localStorage.setItem('tetrado-version',APP_VERSION);
    }catch(e){void e;}
  },[]);
  var colorRef=useRef(0);
  var inputEl=useRef(null);
  var newTaskPanelRef=useRef(null);
  var scrollContainerRef=useRef(null);
  var dragInfoRef=useRef(null);
  var gameRef=useRef({streak:0,lastOpenDate:null,dailyCompletions:{},dailyBonusClaimed:{},streakMsClaimed:0});

  // Keep orderedActiveIds in sync with tasks
  useEffect(function(){
    var activeIds=tasks.filter(function(t){return !t.done;}).map(function(t){return t.id;});
    setOrderedActiveIds(function(prev){
      var existing=prev.filter(function(id){return activeIds.indexOf(id)>-1;});
      var newIds=activeIds.filter(function(id){return prev.indexOf(id)===-1;});
      return newIds.concat(existing);
    });
  },[tasks]);

  // FAB detection via scroll
  useEffect(function(){
    function onScroll(){
      if(!newTaskPanelRef.current){setShowFab(false);return;}
      var rect=newTaskPanelRef.current.getBoundingClientRect();
      setShowFab(rect.bottom<0&&tab==='active');
    }
    var el=scrollContainerRef.current;
    if(el){el.addEventListener('scroll',onScroll,{passive:true});return function(){el.removeEventListener('scroll',onScroll);};}
  },[tab]);

  // Global drag move/end
  useEffect(function(){
    function onMove(e){
      if(!dragInfoRef.current)return;
      var y=e.touches?e.touches[0].clientY:e.clientY;
      var dy=y-dragInfoRef.current.startY;
      var itemH=88;
      var shift=Math.round(dy/itemH);
      if(shift===0)return;
      var newIdx=Math.max(0,Math.min(orderedActiveIds.length-1,dragInfoRef.current.startIndex+shift));
      if(newIdx!==dragInfoRef.current.currentIndex){
        setOrderedActiveIds(function(prev){
          var arr=prev.slice();
          var removed=arr.splice(dragInfoRef.current.startIndex,1)[0];
          arr.splice(newIdx,0,removed);
          dragInfoRef.current.startIndex=newIdx;
          dragInfoRef.current.currentIndex=newIdx;
          dragInfoRef.current.startY=y;
          return arr;
        });
      }
    }
    function onEnd(){
      if(!dragInfoRef.current)return;
      dragInfoRef.current=null;
      setDraggingId(null);
    }
    window.addEventListener('touchmove',onMove,{passive:true});
    window.addEventListener('touchend',onEnd,{passive:true});
    window.addEventListener('mousemove',onMove);
    window.addEventListener('mouseup',onEnd);
    return function(){
      window.removeEventListener('touchmove',onMove);
      window.removeEventListener('touchend',onEnd);
      window.removeEventListener('mousemove',onMove);
      window.removeEventListener('mouseup',onEnd);
    };
  },[orderedActiveIds]);

  var addAward=useCallback(function(award){setScore(function(s){return s+award.pts;});setAwards(function(p){return p.concat([award]);});},[]);

  // Check for lapsed tasks (overdue by 1+ days) and deduct 50pts each, once per task per day
  var checkLapsedTasks=useCallback(function(taskList){
    var today=getToday();
    var lapsed=taskList.filter(function(t){return !t.done&&t.due&&dateDiff(t.due,today)<0&&t.lastPenaltyDate!==today;});
    if(lapsed.length===0)return taskList;
    var deduction=lapsed.length*50;
    setScore(function(s){return Math.max(0,s-deduction);});
    return taskList.map(function(t){
      var isLapsed=lapsed.find(function(l){return l.id===t.id;});
      return isLapsed?Object.assign({},t,{lastPenaltyDate:today}):t;
    });
  },[]);

  var checkStreak=useCallback(function(cur,lastOpen,msClaimed){
    if(lastOpen===TODAY)return;
    var yest=getYesterday();
    var ns=!lastOpen?1:(lastOpen===yest?cur+1:1);
    var nmc=lastOpen===yest?msClaimed:0;
    gameRef.current.streak=ns;gameRef.current.lastOpenDate=TODAY;gameRef.current.streakMsClaimed=nmc;
    setStreak(ns);
    var milestone=STREAK_MS.find(function(m){return m.days===ns&&m.days>nmc;});
    if(milestone){gameRef.current.streakMsClaimed=milestone.days;setTimeout(function(){addAward({type:'streak',pts:milestone.pts,streak:ns});},1200);}
  },[TODAY,addAward]);

  var checkAndFireNotif=useCallback(function(ns){
    try{
      if(!ns||!ns.enabled)return;
      if(safeNotifPermission()!=='granted')return;
      var today2=getToday();
      if(ns.lastFiredDate===today2)return;
      var parts=(ns.time||'09:00').split(':');
      var h=parseInt(parts[0],10);var m=parseInt(parts[1],10);
      var now=new Date();var target=new Date();target.setHours(h,m,0,0);
      if(now>=target){
        if(sendNotification('TETRADO','Tetrado today?')){
          var updated=Object.assign({},ns,{lastFiredDate:today2});
          setNotifSettings(updated);
          storage.set('tetrado-notif',JSON.stringify(updated)).catch(function(e){return e;});
        }
      }
    }catch(e){return;}
  },[]);

  useEffect(function(){
    (async function(){
      try{var r=await storage.get('tetrado-user');if(r&&r.value)setUser(JSON.parse(r.value));}catch(e){void e;}
      try{
        var r2=await storage.get('tetrado-v3');
        if(r2&&r2.value){
          var d=JSON.parse(r2.value);
          var loadedTasks=checkLapsedTasks(d.tasks||[]);
          setTasks(loadedTasks);colorRef.current=d.ci||0;setScore(d.score||0);setDark(d.dark!==false);
          var gd={streak:d.streak||0,lastOpenDate:d.lastOpenDate||null,dailyCompletions:d.dailyCompletions||{},dailyBonusClaimed:d.dailyBonusClaimed||{},streakMsClaimed:d.streakMsClaimed||0};
          gameRef.current=gd;setStreak(gd.streak);
          checkStreak(gd.streak,gd.lastOpenDate,gd.streakMsClaimed);
        }
      }catch(e){void e;}
      try{var r3=await storage.get('tetrado-notif');if(r3&&r3.value){var ns=JSON.parse(r3.value);setNotifSettings(ns);checkAndFireNotif(ns);}}catch(e){void e;}
      setLoaded(true);
    })();
  },[]);

  useEffect(function(){
    if(!loaded)return;
    var gd=gameRef.current;
    storage.set('tetrado-v3',JSON.stringify({tasks:tasks,ci:colorRef.current,score:score,dark:dark,streak:gd.streak,lastOpenDate:gd.lastOpenDate,dailyCompletions:gd.dailyCompletions,dailyBonusClaimed:gd.dailyBonusClaimed,streakMsClaimed:gd.streakMsClaimed})).catch(function(e){return e;});
  },[tasks,score,dark,loaded,streak]);

  var saveUser=useCallback(async function(u){setUser(u);await storage.set('tetrado-user',JSON.stringify(u)).catch(function(e){return e;});},[]);
  var saveNotif=useCallback(async function(ns){setNotifSettings(ns);await storage.set('tetrado-notif',JSON.stringify(ns)).catch(function(e){return e;});},[]);

  var showFloat=useCallback(function(pts){
    var id=Date.now()+Math.random();
    setFloatPts(function(p){return p.concat([{id:id,pts:pts}]);});
    setTimeout(function(){setFloatPts(function(p){return p.filter(function(x){return x.id!==id;});});},1200);
  },[]);

  function addTask(){
    if(!input.trim())return;
    var id=String(Date.now());
    var ci=colorRef.current%PIECES.length;colorRef.current++;
    setTasks(function(p){return [{id:id,text:input.trim(),created:TODAY,due:dueDate||TODAY,done:false,ci:ci,category:null}].concat(p);});
    setDropping(id);setTimeout(function(){setDropping(null);},750);
    var wasMusical=hint.musical;
    setInput('');setDueDate('');setDueSelected(false);if(inputEl.current)inputEl.current.focus();
    if(wasMusical){setTimeout(function(){setSongGame(true);},900);}
  }

  function completeTask(id,taskName,due){
    setScore(function(s){return s+PTS_TASK;});showFloat(PTS_TASK);
    if(dateDiff(due,TODAY)>0)setTimeout(function(){addAward({type:'early',pts:PTS_EARLY,taskName:taskName});},400);
    var dc=Object.assign({},gameRef.current.dailyCompletions);dc[TODAY]=(dc[TODAY]||0)+1;gameRef.current.dailyCompletions=dc;
    var dbc=gameRef.current.dailyBonusClaimed[TODAY]||[];
    var thresh=DAILY_T.find(function(th2){return th2.count===dc[TODAY]&&dbc.indexOf(th2.count)===-1;});
    if(thresh){gameRef.current.dailyBonusClaimed[TODAY]=dbc.concat([thresh.count]);setTimeout(function(){addAward({type:'daily',pts:thresh.pts,count:thresh.count,date:TODAY});},800);}
    setClearing(function(p){var n=new Set(p);n.add(id);return n;});
    setTimeout(function(){setTasks(function(p){return p.map(function(t){return t.id===id?Object.assign({},t,{done:true}):t;});});setClearing(function(p){var n=new Set(p);n.delete(id);return n;});setTab('active');},650);
  }

  function removeTask(id){setTasks(function(p){return p.filter(function(t){return t.id!==id;});});}
  function updateCategory(id,key){setTasks(function(p){return p.map(function(t){return t.id===id?Object.assign({},t,{category:key}):t;});});}

  function startDrag(id,y){
    var idx=orderedActiveIds.indexOf(id);
    dragInfoRef.current={id:id,startY:y,startIndex:idx,currentIndex:idx};
    setDraggingId(id);
  }

  function handleEditSave(id,text,due){
    if(text==='__open__'){setEditingId(id);return;}
    if(text.trim()){
      setTasks(function(p){return p.map(function(t){return t.id===id?Object.assign({},t,{text:text.trim(),due:due||t.due}):t;});});
    }
    setEditingId(null);
  }

  function toggleCollapse(date){
    setCollapsedDates(function(prev){var n=new Set(prev);if(n.has(date))n.delete(date);else n.add(date);return n;});
  }

  // Keep body bg in sync with theme to prevent bounce-scroll flash
  useEffect(function(){
    var bg=TH(dark).bg;
    document.body.style.background=bg;
    document.documentElement.style.background=bg;
  },[dark]);

  var th=TH(dark);
  var notifOn=notifSettings.enabled&&safeNotifPermission()==='granted';
  var taskMap={};
  tasks.forEach(function(t){taskMap[t.id]=t;});
  var active=orderedActiveIds.map(function(id){return taskMap[id];}).filter(Boolean);
  var done=tasks.filter(function(t){return t.done;});

  // Build rows for active tab: TODAY (all active), then past dates collapsed
  function buildActiveRows(){
    var rows=[];
    // TODAY section - all active tasks
    if(active.length>0){
      rows.push({kind:'sep',date:TODAY,count:active.length,collapsible:false});
      active.forEach(function(t){rows.push({kind:'task',task:t});});
    }
    // Past date groups with overdue tasks shown separately
    var pastDates=Array.from(new Set(active.filter(function(t){return t.created<TODAY;}).map(function(t){return t.created;}))).sort(function(a,b){return b.localeCompare(a);});
    // No need to show duplicate past groups since all tasks are in TODAY
    // Instead show a collapsed summary if there are tasks from previous days
    if(pastDates.length>0){
      rows.push({kind:'archive-note',count:active.filter(function(t){return t.created<TODAY;}).length});
    }
    return rows;
  }

  function buildClearedRows(){
    var rows=[];var ld=null;
    done.slice().sort(function(a,b){return b.created.localeCompare(a.created);}).forEach(function(t){
      if(t.created!==ld){
        var dateGroup=done.filter(function(d){return d.created===t.created;});
        var collapsed=collapsedDates.has(t.created)||(!collapsedDates.has(t.created+'_open')&&dateGroup.length>COLLAPSE_THRESHOLD);
        rows.push({kind:'sep',date:t.created,count:dateGroup.length,collapsible:dateGroup.length>COLLAPSE_THRESHOLD,collapsed:collapsed});
        ld=t.created;
      }
      var groupCollapsed=collapsedDates.has(t.created)||(!collapsedDates.has(t.created+'_open')&&done.filter(function(d){return d.created===t.created;}).length>COLLAPSE_THRESHOLD);
      if(!groupCollapsed)rows.push({kind:'task',task:t});
    });
    return rows;
  }

  var rows=tab==='active'?buildActiveRows():buildClearedRows();

  if(!loaded)return null;
  if(!user)return <LoginScreen onLogin={saveUser}/>;

  return(
    <div style={{fontFamily:"'Press Start 2P', monospace",background:th.bg,minHeight:'100vh',backgroundImage:'linear-gradient('+th.grid+' 1px,transparent 1px),linear-gradient(90deg,'+th.grid+' 1px,transparent 1px)',backgroundSize:'28px 28px',maxWidth:'560px',margin:'0 auto',display:'flex',flexDirection:'column',height:'100dvh',overflow:'hidden',position:'relative'}}>
      <style>{'@import url(\'https://fonts.googleapis.com/css2?family=Press+Start+2P&family=VT323&display=swap\');*{box-sizing:border-box;}html,body{margin:0;padding:0;overscroll-behavior:none;}.page-safe-hdr{padding-top:max(22px,env(safe-area-inset-top,22px))!important;}.sticky-hdr{position:sticky;top:0;top:env(safe-area-inset-top,0);z-index:100;padding-top:max(16px,env(safe-area-inset-top,16px));}@keyframes dropIn{0%{transform:translateY(-130px);opacity:0;}55%{transform:translateY(7px);}75%{transform:translateY(-3px);}100%{transform:translateY(0);opacity:1;}}@keyframes lineClear{0%{transform:scaleY(1);opacity:1;}12%{filter:brightness(5);}40%{transform:scaleY(.55) scaleX(1.04);opacity:.8;filter:brightness(2);}70%{transform:scaleY(.12);opacity:.25;}100%{transform:scaleY(0);opacity:0;margin-bottom:0!important;min-height:0!important;}}@keyframes urgBlink{0%,100%{opacity:.7}50%{opacity:1}}@keyframes coinFall{0%{transform:translateY(0) rotate(0deg);opacity:1;}85%{opacity:.9;}100%{transform:translateY(110vh) rotate(720deg);opacity:0;}}@keyframes floatUp{0%{transform:translateY(0);opacity:1;}100%{transform:translateY(-55px);opacity:0;}}@keyframes certIn{0%{transform:scale(.82);opacity:0;}100%{transform:scale(1);opacity:1;}}@keyframes fadeIn{from{opacity:0;transform:translateY(5px);}to{opacity:1;transform:none;}}.blk.dropping{animation:dropIn .7s cubic-bezier(.22,.61,.36,1) both;}.blk.clearing{animation:lineClear .65s ease-in both;pointer-events:none;overflow:hidden;}.blk.dragging{box-shadow:0 8px 24px rgba(0,0,0,0.4);z-index:10;position:relative;}.blk{position:relative;margin-bottom:8px;touch-action:pan-y;}.blk:hover .acts{opacity:1!important;}.act{background:rgba(0,0,0,0.55);border:1px solid rgba(255,255,255,0.15);color:rgba(255,255,255,0.55);font-family:\'Press Start 2P\',monospace;font-size:6px;padding:5px 7px;cursor:pointer;transition:all .12s;line-height:1;}.act.ok:hover{background:rgba(0,255,100,.25);border-color:rgba(0,255,100,.5);color:#80FF80;}.act.del:hover{background:rgba(255,50,50,.25);border-color:rgba(255,50,50,.5);color:#FF8080;}.drop-btn{background:#00F0F0;border:none;color:#001414;font-family:\'Press Start 2P\',monospace;font-size:8px;padding:0 18px;cursor:pointer;letter-spacing:1px;white-space:nowrap;box-shadow:0 4px 0 #007878;transition:transform .1s,box-shadow .1s;}.drop-btn:hover{background:#80F8F8;}.drop-btn:active{transform:translateY(4px);box-shadow:0 0 0 #007878;}.ti{width:100%;border:1px solid;font-family:\'VT323\',monospace;font-size:22px;padding:10px 12px;outline:none;letter-spacing:1px;}.urgent-blink{animation:urgBlink 1.6s ease-in-out infinite;}.tab-panel{animation:fadeIn .18s ease both;}.cert-card{animation:certIn .3s cubic-bezier(.22,.61,.36,1) both;}.fab{position:absolute;bottom:32px;left:50%;transform:translateX(-50%);width:56px;height:56px;border-radius:50%;background:#00F0F0;border:none;color:#001414;font-size:28px;cursor:pointer;box-shadow:0 4px 16px rgba(0,240,240,0.4);z-index:90;display:flex;align-items:center;justify-content:center;font-family:monospace;transition:transform .15s;}.fab:active{transform:translateX(-50%) scale(0.92);}'}</style>

      {floatPts.map(function(fp){return <div key={fp.id} style={{position:'fixed',top:'42%',left:'50%',transform:'translateX(-50%)',zIndex:200,fontFamily:"'Press Start 2P', monospace",fontSize:'11px',color:th.scoreCol,textShadow:th.scoreGlow,animation:'floatUp 1.1s ease-out both',pointerEvents:'none',letterSpacing:'2px'}}>+{fp.pts}</div>;})}

      {awards.length>0&&<Certificate award={awards[0]} user={user} onDismiss={function(){setAwards(function(p){return p.slice(1);});}}/>}
      {editProfile&&<ProfileModal user={user} dark={dark} onSave={function(u){saveUser(u);setEditProfile(false);}} onClose={function(){setEditProfile(false);}}/>}
      {showNotif&&<NotifModal notifSettings={notifSettings} onSave={saveNotif} onClose={function(){setShowNotif(false);}} dark={dark}/>}
      {songGame&&hint.musical&&<SongGame hint={hint} dark={dark} onClose={function(){setSongGame(false);}} onAward={function(pts){addAward({type:'song',pts:pts,title:'MUSIC MASTER'});showFloat(pts);setSongGame(false);}}/>}
      {showAbout&&<AboutPage user={user} dark={dark} score={score} streak={streak} hasUpdate={hasUpdate} onEditProfile={function(){setShowAbout(false);setEditProfile(true);}} onOpenSettings={function(){setShowAbout(false);setShowSettings(true);}} onClose={function(){setShowAbout(false);}}/>}
      {showSettings&&<SettingsPage notifSettings={notifSettings} onSaveNotif={saveNotif} dark={dark} onToggleDark={function(){setDark(function(d){return !d;});}} onClose={function(){setShowSettings(false);}}/>}

      {/* Fixed header */}
      <div className="sticky-hdr" style={{background:th.bg,paddingLeft:'22px',paddingRight:'22px',paddingBottom:'0',borderBottom:'2px solid '+th.hdrBdr,flexShrink:0}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',paddingBottom:'8px'}}>
          <div>
            <div style={{fontSize:'20px',color:th.accent,letterSpacing:'6px',marginBottom:'4px',textShadow:dark?'0 0 18px '+th.accent+'80':'none'}}>TETRADO</div>
            <div style={{display:'flex',gap:'16px',fontSize:'7px',color:th.muted,letterSpacing:'1px'}}>
              <span>PTS <span style={{color:th.scoreCol,textShadow:th.scoreGlow}}>{fmtScore(score)}</span></span>
              <span>STREAK <span style={{color:th.scoreCol,textShadow:th.scoreGlow}}>{streak}</span></span>
            </div>
          </div>
          <div style={{cursor:'pointer',position:'relative'}} onClick={function(){setShowAbout(true);setHasUpdate(false);}} title="Profile">
            <AvatarCanvas grid={user.grid} size={38} style={{border:'2px solid '+th.panelBdr,background:th.inp}}/>
            {hasUpdate&&<span style={{position:'absolute',top:'-3px',right:'-3px',width:'10px',height:'10px',borderRadius:'50%',background:'#FF3333',border:'2px solid '+th.bg,display:'block'}}/>}
          </div>
        </div>
        {/* Tabs */}
        <div style={{display:'flex',gap:'6px',paddingTop:'8px',paddingBottom:'0'}}>
          {['active','cleared'].map(function(id){var on=tab===id;var count=id==='active'?active.length:done.length;return(
            <button key={id} onClick={function(){setTab(id);}} style={{fontFamily:"'Press Start 2P', monospace",fontSize:'7px',letterSpacing:'1px',padding:'10px 14px',cursor:'pointer',flex:1,border:'none',background:on?th.tabOnBg:th.tabOffBg,color:on?th.tabOn:th.tabOff,borderTop:'2px solid '+(on?th.tabOn:th.panelBdr),borderLeft:'2px solid '+(on?th.tabOn+'80':th.panelBdr),borderRight:'2px solid '+(on?th.tabOff+'CC':th.panelBdr),borderBottom:'2px solid '+(on?th.tabOff+'CC':th.panelBdr),textShadow:on&&dark?'0 0 10px '+th.accent+'80':'none',transition:'all .15s'}}>
              {id.toUpperCase()} <span style={{color:th.scoreCol}}>{count}</span>
            </button>
          );})}
        </div>
      </div>

      {/* Scrollable content */}
      <div ref={scrollContainerRef} style={{flex:1,overflowY:'auto',paddingLeft:'22px',paddingRight:'22px',paddingBottom:'120px',paddingTop:'4px',WebkitOverflowScrolling:'touch'}}>
        {tab==='active'&&<NewTaskPanel
          hint={hint} dark={dark} input={input} dueDate={dueDate} dueSelected={dueSelected} today={TODAY}
          onInput={function(v){setInput(v);setDueSelected(false);setDueDate('');}}
          onSelectDue={function(v){setDueDate(v);setDueSelected(true);}}
          onDrop={addTask} onNote={function(){setSongGame(true);}}
          inputRef={inputEl} th={TH(dark)} panelRef={newTaskPanelRef}
        />}

        <div className="tab-panel">
          {rows.length===0&&<div style={{textAlign:'center',padding:'80px 20px',fontSize:'8px',color:th.accent+'16',lineHeight:3.5,letterSpacing:'2px'}}>{tab==='active'?'BOARD EMPTY':'NO CLEARED LINES'}</div>}
          {rows.map(function(row,ri){
            if(row.kind==='archive-note'){
              return <div key="archive-note" style={{fontSize:'6px',letterSpacing:'1px',padding:'12px 14px',marginBottom:'8px',background:th.inp,border:'1px solid '+th.panelBdr,color:th.muted,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <span>{'↑ '+row.count+' TASK'+(row.count!==1?'S':'')+' CARRIED FROM PREVIOUS DAYS'}</span>
              </div>;
            }
            if(row.kind==='sep'){
              var isToday=row.date===TODAY;
              var isCollapsed=row.collapsed;
              return(
                <div key={'sep-'+row.date} onClick={row.collapsible?function(){toggleCollapse(isCollapsed?row.date+'_open':row.date);}:undefined} style={{fontSize:'7px',letterSpacing:'2px',padding:'18px 0 10px',marginBottom:'10px',borderBottom:'1px solid '+th.sep,color:isToday?th.lblToday:th.lblPast,textShadow:isToday&&dark?'0 0 12px '+th.accent+'60':'none',cursor:row.collapsible?'pointer':'default',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <span>{isToday?'TODAY':relDate(row.date,TODAY)}</span>
                  {row.collapsible&&<span style={{fontSize:'6px',opacity:0.6}}>{isCollapsed?'('+row.count+' TASKS — TAP TO EXPAND)':'TAP TO COLLAPSE'}</span>}
                </div>
              );
            }
            var t2=row.task;
            return <TaskBlock key={t2.id} t={t2} dropping={dropping===t2.id} isClearing={clearing.has(t2.id)} today={TODAY} dark={dark}
              onComplete={function(){completeTask(t2.id,t2.text,t2.due);}} onRemove={function(){removeTask(t2.id);}} onCategoryChange={function(key){updateCategory(t2.id,key);}}
              onDragStart={function(id,y){startDrag(id,y);}} isDragging={draggingId===t2.id}
              editingId={editingId} onEditSave={handleEditSave} onEditCancel={function(){setEditingId(null);}}/>;
          })}
        </div>
      </div>

      {/* FAB */}
      {showFab&&tab==='active'&&(
        <button className="fab" onClick={function(){
          var el=scrollContainerRef.current;
          if(el){el.scrollTo({top:0,behavior:'smooth'});}
          setTimeout(function(){if(inputEl.current){inputEl.current.focus();inputEl.current.click();}},450);
        }} title="Add new task">+</button>
      )}
    </div>
  );
}
