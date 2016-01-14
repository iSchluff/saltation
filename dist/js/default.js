(function(){
  "use strict";

  window.AudioContext= window.AudioContext || window.webkitAudioContext;

  var ac = new AudioContext();

  var globals= {
    amount: 4,
    leftCount: 4,
    rightCount: 4,

    clickLength: 10,
    clickPause: 40,
    volume: 0.5,
    ratio: 0.5,
    ILD: 15,

    // band: "wide",
  };

  var bufferSize = 2 * ac.sampleRate,
      noiseBuffer = ac.createBuffer(1, bufferSize, ac.sampleRate),
      output = noiseBuffer.getChannelData(0);

  // var b0, b1, b2, b3, b4, b5, b6;
  // b0 = b1 = b2 = b3 = b4 = b5 = b6 = 0.0;
  // for (var i = 0; i < bufferSize; i++) {
  //     var white = Math.random() * 2 - 1;
  //     b0 = 0.99886 * b0 + white * 0.0555179;
  //     b1 = 0.99332 * b1 + white * 0.0750759;
  //     b2 = 0.96900 * b2 + white * 0.1538520;
  //     b3 = 0.86650 * b3 + white * 0.3104856;
  //     b4 = 0.55000 * b4 + white * 0.5329522;
  //     b5 = -0.7616 * b5 - white * 0.0168980;
  //     output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
  //     output[i] *= 0.11; // (roughly) compensate for gain
  //     b6 = white * 0.115926;
  // }

  var gainNode= ac.createGain();
  gainNode.gain.value= globals.volume;
  gainNode.connect(ac.destination);

  var leftGain= ac.createGain();
  var leftNode= ac.createGain();
  var leftMerger= ac.createChannelMerger(2);
  leftNode.connect(leftGain);
  leftGain.connect(leftMerger, 0, 1);
  leftNode.connect(leftMerger, 0, 0);
  leftMerger.connect(gainNode);

  var rightGain= ac.createGain();
  var rightNode= ac.createGain();
  var rightMerger= ac.createChannelMerger(2);
  rightNode.connect(rightGain);
  rightGain.connect(rightMerger, 0, 0);
  rightNode.connect(rightMerger, 0, 1);
  rightMerger.connect(gainNode);

  var btn= document.querySelector(".playBtn");
  var running= false;


  var queueTick= function(offset, length, node){
    var now = ac.currentTime;
    var src;

    if(globals.band === "wide"){
      src = ac.createBufferSource();
      src.buffer = noiseBuffer;
      src.loop = true;
    }else{
      src= ac.createOscillator();
      src.type= "square";
      src.frequency.value= 500;
    }

    src.connect(node);
    src.start(now + offset / 1000); // Play sound source 1 instantly
    src.stop(now + offset / 1000 + length / 1000);
    return src;
  };

  btn.addEventListener("click", function(){
    if(!running){
      running= true;

      var offset= 500,
      times= globals.amount*2,
      osc;

      for(var i=0; i<times; i++){
        var node= i<globals.leftCount ? leftNode : rightNode;
        osc= queueTick(offset + (globals.clickLength + globals.clickPause) * i, globals.clickLength, node);
        // if(i === times-1){
        //   osc.onended= function(){
        //     running= false;
        //     console.log("end");
        //   };
        // }
      }

      // onended does not always work in safari
      setTimeout(function(){
        running= false;
        console.log("ended");
      }, (offset + (globals.clickLength + globals.clickPause) * (times-1)) -globals.clickPause);
    }
  });

  // #### Volume Slider ####
  var volumeSlider= $(".volumeSlider");
  volumeSlider.noUiSlider({
	start: [globals.volume],
    connect: "lower",
	range: {
      'min': 0,
      'max': 1
	}
  });

  volumeSlider.on("slide", function(event, value){
    globals.volume= Number(value);
    gainNode.gain.value= globals.volume;
  });

  // #### Count Slider ####
  var ratioSlider= $(".ratioSlider");
  ratioSlider.noUiSlider({
  start: [globals.ratio],
    connect: "lower",
  range: {
      'min': 0,
      'max': 1
  }
  });

  ratioSlider.on("slide", function(event, value){
    globals.ratio= Number(value);
    setRatioText();
  });

  var ratioText= $(".ratioControl .text");
  var setRatioText= function(){
    var d= Math.round(((globals.amount * 2) - 2) * globals.ratio);
    var left= 1 + d;
    var right= 1 + ((globals.amount * 2) - 2 - d);
    globals.leftCount= left;
    globals.rightCount= right;
    ratioText.text(left+":"+right);
  };
  setRatioText();


  // #### Slider Setup ####

  var amountSlider= $(".amountSlider");
  amountSlider.noUiSlider({
  start: [globals.amount],
    connect: "lower",
    step: 1,
  range: {
      'min': 2,
      'max': 10
  }
  }).noUiSlider_pips({
    mode: "steps",
    density: 10
  }).Link("lower").to($(".amountText"), "text", wNumb({decimals: 0}));

  var lengthSlider= $(".lengthSlider");
  lengthSlider.noUiSlider({
	start: [globals.clickLength],
    connect: "lower",
  	range: {
        'min': [4, 2],
        "30%": [10, 5],
        "65%": [30, 15],
        'max': 90
  	}
}).noUiSlider_pips({
    mode: "steps",
    density: 7,
    format: wNumb({
        postfix: 'ms'
    })
  }).Link("lower").to($(".lengthText"), "text", wNumb({decimals: 0, postfix: "ms"}));

  var pauseSlider= $(".pauseSlider");
  pauseSlider.noUiSlider({
	start: [globals.clickPause],
    connect: "lower",
	range: {
      'min': [10, 20],
      "50%": [90, 50],
      'max': 240
	}
  }).noUiSlider_pips({
    mode: "steps",
    density: 5,
    format: wNumb({
		    postfix: 'ms'
	  })
  }).Link("lower").to($(".pauseText"), "text", wNumb({decimals: 0, postfix: "ms"}));

  var ildSlider= $(".ildSlider");
  ildSlider.noUiSlider({
	start: [globals.ILD],
    connect: "lower",
    step: 3,
	range: {
      'min': 9,
      'max': 30
	}
  }).noUiSlider_pips({
    mode: "steps",
    density: 7,
    format: wNumb({
        postfix: "dB"
    })
  }).Link("lower").to($(".ildText"), "text", wNumb({postfix: "dB"}));

  var log10= function(x) {
    return Math.log(x) / Math.LN10;
  };

  // #### Slider Events ####
  amountSlider.on("set", function(event, value){
    globals.amount= Number(value);
    setRatioText();
  });
  lengthSlider.on("set", function(event, value){
    globals.clickLength= Number(value);
  });
  pauseSlider.on("set", function(event, value){
    globals.clickPause= Number(value);
  });

  ildSlider.on("set", function(event, value){
    setILD(Number(value));
  });

  var setILD=function(ild){
    var percentage= Math.pow(10, -Number(ild) / 20);
    leftGain.gain.value= percentage;
    rightGain.gain.value= percentage;
  };

  setILD(globals.ILD);
}());
