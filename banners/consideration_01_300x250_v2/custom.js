
var tl;

document.addEventListener("DOMContentLoaded", function (event) {
	tl = new TimelineMax({repeat:1, repeatDelay:1, onComplete:checkTime});

	playMainAnimation();
});


playMainAnimation = function () {
	tl.set([packshot, cta], {x: 300})
	tl.set(cta, {transformOrigin: "150px 188px"})

	tl.addLabel("frame01");
		tl.to([copy01], 0.3, {opacity: 1, ease: Sine.easeInOut}, "+=0.5")

	tl.addLabel("frame02");
		tl.to([copy01], 0.3, {opacity: 0, ease: Sine.easeInOut}, "+=3")
		tl.to(copy02, 0.3, {opacity: 1, ease: Sine.easeInOut}, "+=0.2")

	tl.addLabel("frame03");
		tl.to(copy02, 0.3, {opacity: 0, ease: Sine.easeInOut}, "+=1")
		tl.to(copy03, 0.3, {opacity: 1, ease: Sine.easeInOut}, "+=0.2")
		tl.to(legal_text, 0.3, {alpha: 1, ease: Sine.easeInOut})

	tl.addLabel("frame04");
		tl.to(copy03, 0.3, {opacity: 0, ease: Sine.easeInOut}, "+=3.5")
		tl.to(copy04, 0.3, {opacity: 1, ease: Sine.easeInOut}, "+=0.2")

	tl.addLabel("frame05");
		tl.to([copy04,legal_text], 0.3, {opacity: 0, ease: Sine.easeInOut}, "+=2")
		tl.staggerTo([packshot, cta], 0.5, {x: 0, rotationZ:0.01, force3D: true, ease: Bounce.easeNone}, 0.25, "+=0.2")
		tl.to(cta, 0.15, {scale: 1.1, yoyo: true, repeat: 3, ease: Sine.easeInOut});
}


function checkTime(){
    console.log("Time at this point is " + tl.totalTime().toFixed(2));
}
