const robot = {
  file: require('./robots/file'),
  twitter: require('./robots/twitter'),
} 
async function init() {
  try {
    await robot.file();
    //await robot.twitter();
    console.log("> [ALL ROBOTS]  === the robots' actions were executed successfully! ==");
    process.exit(0);
  } catch(e) {
    console.log("Erro no orquestrador: " + e.message);
    process.exit(1);
  }
  
}


init();