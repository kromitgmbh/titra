// http://stackoverflow.com/questions/21646738/convert-hex-to-rgba
export default function hex2rgba(hex,opacity = 50){
 hex = hex.replace('#','');
 r = parseInt(hex.substring(0, hex.length/3), 16);
 g = parseInt(hex.substring(hex.length/3, 2*hex.length/3), 16);
 b = parseInt(hex.substring(2*hex.length/3, 3*hex.length/3), 16);

 result = 'rgba('+r+','+g+','+b+','+opacity/100+')';
 return result;
}