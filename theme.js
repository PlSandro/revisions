(function(){
"use strict";
var KEY="site-theme";
function apply(t){
  if(t==="light"||t==="dark") document.documentElement.dataset.theme=t;
  else delete document.documentElement.dataset.theme;
}
var stored=null;
try{ stored=window.localStorage.getItem(KEY); }catch(e){}
apply(stored);

window.toggleSiteTheme=function(){
  var cur=document.documentElement.dataset.theme;
  var isLight = cur ? cur==="light" : window.matchMedia("(prefers-color-scheme: light)").matches;
  var next = isLight ? "dark" : "light";
  try{ window.localStorage.setItem(KEY,next); }catch(e){}
  window.location.reload();
};
})();
