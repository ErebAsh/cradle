let userCanX = 185;
let userCanY = 0;
let fireTime = 13000;
let countdown = (fireTime / 1000) - 3;
let hitAudio = new Audio('http://soundbible.com/mp3/Sniper_Rifle-Kibblesbob-2053709564.mp3');
let fireAudio = new Audio('http://soundbible.com/mp3/Super%20Punch%20MMA-SoundBible.com-1869306362.mp3');

let stats = CannonStorage.loadStats();

function updateHUD() {
  $('#hud-score').text(stats.score);
  $('#hud-high-score').text(stats.highScore);
  $('#hud-streak').text(stats.currentStreak + '🔥');
  $('#hud-best-streak').text(stats.bestStreak);
  const acc = stats.totalShots > 0 ? Math.round((stats.totalHits / stats.totalShots) * 100) : 100;
  $('#hud-accuracy').text(acc + '%');
}

$(document).ready(() => {
  updateHUD();
});

setInterval(() => {
  countdown = countdown > 0 ? countdown : 0;
  $('.countdown').text(countdown--);
}, 1000);

setInterval(() => {
  let cmCanPipe = $('.cm .pipe');
  let allPipe = $('.pipe');
  let cmCan = $('.cannon.cm');
  let canBall = $('.ball');
  let cmCanAngle = Math.floor(Math.random() * 45);
  let cmCanX = Math.floor(Math.random() * 8) + 2;
  
  let ballMileage = CannonEngine.calculateBallMileage(cmCanX, cmCanAngle);
  countdown = (fireTime / 1000) - 3;

  cmCanPipe.css({ transform: 'rotate(' + cmCanAngle + 'deg)' });
  cmCan.css({ transform: 'translateX(' + cmCanX + 'cm)' });
  $('.cm .wheel').css({ transform: 'rotate(' + cmCanX + 'deg)' });

  $('.level-monitor').text(cmCanAngle);
  canBall.css('left', 0);
  allPipe.removeClass('fire');
  $('.game-container').removeClass('defended');
  $('.level').width(ballMileage + 'cm');

  setTimeout(() => {
    let comCanX = cmCanX * 37.79;
    let isHit = CannonEngine.validateHit(userCanX, userCanY, comCanX, cmCanAngle);

    try { fireAudio.play().catch(() => {}); } catch(e) {}
    allPipe.addClass('fire');

    const scoreResult = CannonEngine.calculateScore(isHit, stats.currentStreak);
    stats = CannonStorage.recordShot(stats, isHit, scoreResult.scoreAwarded, scoreResult.newStreak);
    updateHUD();

    if (isHit) {
      $('.game-container').addClass('defended');
      canBall.animate({
        left: (-ballMileage + 4.23) + 'cm'
      }, 500, () => {
        try { hitAudio.play().catch(() => {}); } catch(e) {}
      });
    } else {
      canBall.animate({
        left: '-100vw'
      }, 1000);
    }
  }, (fireTime - 2000));
}, fireTime);

$('.wheel-handle').mousedown((e) => {
  const clickX = e.pageX;
  let canX = 0;
  $(this).mousemove((e) => {
    let canDX = (e.pageX - clickX) + userCanX;
    canX = canDX < 375 && canDX > 35 ? canDX : canX;

    $('.user-col .cannon').css({ transform: 'translateX(' + canX + 'px)' });
    $('.user-col .wheel').css({ transform: 'rotate(' + canX + 'deg)' });
  });

  $(this).mouseup(() => {
    $(this).unbind("mousemove");
    userCanX = canX;
  });
});

$('.level-handle').mousedown((e) => {
  const clickY = e.pageY;
  let canY = 0;
  $(this).mousemove((e) => {
    let canDY = (e.pageY - clickY) + userCanY;
    canY = canDY < 65 && canDY > -5 ? canDY : canY;

    $('.level-handle').text(canY);
    $('.user-col .pipe').css({ transform: 'rotate(' + canY + 'deg)' });
  });

  $(this).mouseup(() => {
    $(this).unbind("mousemove");
    userCanY = canY;
  });
});

$(document).mouseup(() => {
  $(this).unbind("mousemove");
});
