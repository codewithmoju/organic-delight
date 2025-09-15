function t(t,e,n){let u=null;return function(...n){u&&clearTimeout(u),u=setTimeout(()=>{u=null,t(...n)},e)}}export{t as d};
