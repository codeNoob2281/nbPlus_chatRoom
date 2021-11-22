var timex=new Date('11-13-2021 23:59:12');
var timey=new Date('11-14-2021 0:0:12');
// console.log(time.toLocaleTimeString().substring(0,time.toLocaleTimeString().indexOf(':',5))-1);
// var timea=time.toLocaleString();
// console.log(timea);
// timea=timea.substring(0,timea.indexOf(':',15));
// console.log(timea);

var message={
    time:new Date()
}

console.log(message.time.toLocaleString().substring(0,message.time.toLocaleString().indexOf(':',15)))

// console.log(timey-timex);