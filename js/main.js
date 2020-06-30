'use strict';

(() => {

  const radio = document.querySelectorAll('.radioBtn > div');
  const message = document.getElementById('message');
  const playBtn = document.getElementById('playBtn');
  const checkMessage = document.getElementById('checkMessage');

  let dropInterval;
  let selectNum;
  let selectComp = false;

  // ラジオボタンの作成
  radio.forEach((clickItem, index) => {
    clickItem.addEventListener('click', () => {
      if(selectComp) {
        return;
      }
      radio.forEach(item => {
        item.classList.remove('active');
      });
      clickItem.classList.add('active');
      selectNum = index;
      switch(index){
        case 0:
          checkMessage.textContent = 'Easyモードです';
          break;
        case 1:
          checkMessage.textContent = 'Normalモードです';
          break;
        case 2:
          checkMessage.textContent = 'Hardモードです';
          break;
      }
    });
  });

  // テトロミノの型をまとめた配列
  const tetrominoTypes = [
    [],
    // 1. I
    [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ],
    // 2. L
    [
      [0, 1, 0, 0],
      [0, 1, 0, 0],
      [0, 1, 1, 0],
      [0, 0, 0, 0]
    ],
    // 3. J
    [
      [0, 0, 1, 0],
      [0, 0, 1, 0],
      [0, 1, 1, 0],
      [0, 0, 0, 0]
    ],
    // 4. T
    [
      [0, 1, 0, 0],
      [0, 1, 1, 0],
      [0, 1, 0, 0],
      [0, 0, 0, 0]
    ],
    // 5. O
    [
      [0, 0, 0, 0],
      [0, 1, 1, 0],
      [0, 1, 1, 0],
      [0, 0, 0, 0]
    ],
    // 6. Z
    [
      [0, 0, 0, 0],
      [1, 1, 0, 0],
      [0, 1, 1, 0],
      [0, 0, 0, 0]
    ],
    // 7. S
    [
      [0, 0, 0, 0],
      [0, 1, 1, 0],
      [1, 1, 0, 0],
      [0, 0, 0, 0]
    ]
  ];

  // テトロミノの色
  const tetrominoColors = [
    '',
    '#00ecff', //水色
    '#ffa500', //オレンジ 
    '#4169e1', //青  
    '#ba55d3', //紫  
    '#ffff00', //黄色  
    '#dc143c', //赤  
    '#32cd32' //緑  
  ];

  // キャンバスの読み込み
  const canvas = document.querySelector('canvas');
  if(typeof canvas.getContext === 'undefined'){
    return;
  }
  const ctx = canvas.getContext('2d');

  // フィールドの縦横ブロック数
  const fieldWsize = 10;
  const fieldHsize = 20;

  // ブロックの大きさとテトロミノのサイズ
  const blockSize = 30;
  const smallBlocksize = 15;
  const tetrominoSize = 4;

  // フィールドの縦横の大きさ
  const fieldWidth = fieldWsize * blockSize;
  const fieldHeight = fieldHsize * blockSize;

  // キャンバスの縦横の大きさを設定
  canvas.width = 450;
  canvas.height = fieldHeight;
  canvas.style.border = '10px solid #48d1cc';

  function initialField() {
    // フィールド横の縦横の大きさ
    ctx.fillStyle = '#48d1cc';
    ctx.fillRect(fieldWidth, 0, canvas.width - fieldWidth, canvas.height);

    // Nextという文字表示
    ctx.textAlign = 'center';
    ctx.font = '20px Arrial';
    ctx.lineWidth = 1.5;
    ctx.strokeText('Next', centerLine, blockSize);
    ctx.fillStyle = 'black';
    ctx.fillText('Next', centerLine, blockSize);
  
    // Scoreという文字表示
    ctx.strokeText('Score', centerLine, blockSize * 14);
    ctx.fillText('Score', centerLine, blockSize * 14);
  }

  // 次のテトロミノの表示画面、スコア画面のwidthの始点,終点
  let startWidth = fieldWidth + 20;
  let endWidth = canvas.width - fieldWidth - 30;

  // テキストのwidthのセンター位置
  let centerLine = (canvas.width - fieldWidth) / 2 + fieldWidth;

  // 次のテトロミノを表示する画面の縦横の大きさ
  function ntetroWindow() {
    ctx.fillStyle = 'black';
    ctx.fillRect(startWidth, blockSize * 2, endWidth, blockSize * 10);
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 20;
    ctx.lineJoin = 'round';
    ctx.strokeRect(startWidth, blockSize * 2, endWidth, blockSize * 10);
  }

  // スコア画面の縦横の大きさ
  function scoreWindow() {
    ctx.fillStyle = 'black';
    ctx.fillRect(startWidth, 15 * blockSize, endWidth, blockSize * 3);
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 20;
    ctx.lineJoin = 'round';
    ctx.strokeRect(startWidth, 15 * blockSize, endWidth, blockSize * 3);
  }

  // 動作しているテトロミノの型,Nextにあるテトロミノの型宣言
  let tetromino
  const ntetroY = [4, 8, 12, 16, 20, 24];
  let tetromino_next = [];
  let randomNum = [];
  
  function initialTetromino() {
    for(let i = 0; i < 6; i++){
      randomNum.push(Math.floor(Math.random() * (tetrominoTypes.length - 1)) + 1);
      if(i !== 0){
        tetromino_next.push(tetrominoTypes[randomNum[i]]);
      }
    }
    tetromino = tetrominoTypes[randomNum[0]];
  }

  // テトロミノが出現する位置
  const startX = fieldWsize / 2 - tetrominoSize / 2;
  const startY = 0;

  // x,yの座標
  let tetrominoX = startX;
  let tetrominoY = startY;

  // ゲームオーバーか判定
  let gameOver = false;

  // スコア
  let score = 0, compLine = 0;

  // フィールドの初期化
  let field = [];
  function initial() {
    for(let y = 0; y < fieldHsize; y++){
      field[y] = [];
      for(let x = 0; x < fieldWsize; x++){
        field[y][x] = 0;
      }
    }
  }

  // スコアを表示
  function showScore(compLine) {
    score = 20 * compLine;
    ctx.clearRect(startWidth, 15 * blockSize, endWidth, blockSize * 3);
    scoreWindow();
    ctx.textAlign = 'center';
    ctx.lineWidth = 4;
    ctx.font = '40px Arrial';
    ctx.fillStyle = 'white';
    ctx.strokeText(score, centerLine, blockSize * 17);
    ctx.fillText(score, centerLine, blockSize * 17);
  }

  // 下端でテトロミノを固定する
  function fixTetromino() {
    for(let y = 0; y < tetrominoSize; y++){
      for(let x = 0; x < tetrominoSize; x++){
        if(tetromino[y][x]){
          field[tetrominoY + y][tetrominoX + x] = randomNum[0];
        }
      }
    }
  }

  // ラインがそろったら消す処理
  function checkLine() {
    for(let y = 0; y < fieldHsize; y++){
      let checkLine = true;
      for(let x = 0; x < fieldWsize; x++){
        if(!field[y][x]){
          checkLine = false;
          break;
        }
      }

      if(checkLine){
        for(let ny = y; ny > 0; ny--){
          for(let nx = 0; nx <= fieldWsize; nx++){
            field[ny][nx] = field[ny -1][nx - 1];
          }
        }        
        compLine++;
      }
    }
    showScore(compLine);
  }

  // テトロミノを自動的に下に動かす
  function dropTetoromino() {
    if(gameOver){
      return;
    }

    if(checkMoveable(0, 1)) {
      tetrominoY++;
    }
    else{
      fixTetromino();
      randomNum.shift();
      let randomNum_next = Math.floor(Math.random() * (tetrominoTypes.length - 1)) + 1;
      randomNum.push(randomNum_next);
      tetromino = tetrominoTypes[randomNum[0]];
      tetromino_next.shift();
      tetromino_next.push(tetrominoTypes[randomNum_next]);
      tetrominoX = startX;
      tetrominoY = startY;
      checkLine();
      ctx.clearRect(startWidth, blockSize * 2, endWidth, blockSize * 10);
      ntetroWindow();
      if(!checkMoveable(0, 0)){
        gameOver = true;
      }
    }
    draw();

    setTimeout(() => {
      dropTetoromino();
    }, dropInterval);
  }

  // ブロック1つを描画
  function drawBrock(x, y, colorNum, num) {
    let px, py, sizing;
    if(num){
      sizing = smallBlocksize;    
    }
    else{
      sizing = blockSize;
    }
    px = sizing  * x;
    py= sizing  * y;
    ctx.fillStyle = tetrominoColors[colorNum];
    ctx.fillRect(px, py, sizing, sizing);
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.strokeRect(px, py, sizing, sizing);
  }

  function draw() {
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, fieldWidth, fieldHeight);
    
    // フィールドにブロック表示
    for(let y = 0; y < fieldHsize; y++){
      for(let x = 0; x < fieldWsize; x++){
        ctx.strokeStyle = '#bbb';
        ctx.lineWidth = 0.1;
        ctx.strokeRect(blockSize * x, blockSize * y, blockSize, blockSize);
        if(field[y][x]){
          drawBrock(x, y, field[y][x]);
        }
      }
    }

    // テトロミノを表示
    for(let y = 0; y < tetrominoSize; y++){
      for(let x = 0; x < tetrominoSize; x++){
        if(tetromino[y][x]){
          drawBrock(tetrominoX + x, tetrominoY + y, randomNum[0], 0);
        }
      }
    }

    // Nextのテトロミノを表示
    for(let i = 0; i < 5; i++){
      for(let y = 0; y < tetrominoSize; y++){
        for(let x = 0; x < tetrominoSize; x++){
          if(tetromino_next[i][y][x]){
            drawBrock(23 + x, ntetroY[i] + y, randomNum[i + 1], 1);
          }
        }
      }
    }

    if(gameOver){
      let text = 'Game Over';
      ctx.font = '40px Arrial';
      let textX = fieldWidth / 2;
      let textY = fieldHeight / 2 - 20;
      ctx.lineWidth = 5;
      ctx.strokeText(text, textX, textY);
      ctx.fillStyle = 'white';
      ctx.fillText(text, textX, textY);
      radio.forEach(item => {
        item.classList.remove('active');
      });
      selectComp = false;
      playBtn.textContent = 'リトライ';
      checkMessage.textContent = '　';
      selectNum = '';
      tetromino_next = [];
      randomNum = [];
      playBtn.classList.remove('inactive');
      if(compLine > 12){
        message.textContent = 'とても素晴らしいスコアです！';
      }
      else if(7 < compLine && compLine <= 12 ){
        message.textContent = 'ナイススコアです！';
      }
      else{
        message.textContent = 'もう少し頑張りましょう';
      }
    }
  }

  // キーボードを押したときに移動できるかチェック
  function checkMoveable(mx, my, newTetromino) {
    if(typeof newTetromino === 'undefined'){
      newTetromino = tetromino;
    }
    for(let y = 0; y < tetrominoSize; y++){
      for(let x = 0; x < tetrominoSize; x++){
        let nx = tetrominoX + mx + x;
        let ny = tetrominoY + my + y;
        if(newTetromino[y][x]){
          if(ny < 0 || nx < 0 || ny >= fieldHsize || nx >= fieldWsize || field[ny][nx]) return false;
        }
      }
    }
    return true;
  }

  // テトロミノの回転
  function rotate() {
    let newTetromino = [];

    for(let y = 0; y < tetrominoSize; y++){
      newTetromino[y] = [];
      for(let x = 0; x < tetrominoSize; x++){
        newTetromino[y][x] = tetromino[tetrominoSize - x- 1][y];
      }
    }
    return newTetromino;
  }
  
  // 即時に落とす
  function roopDown() {
    if(checkMoveable(0, 1)){
      tetrominoY++;
      setTimeout(() => {
        roopDown();
      }, 1);
    }
  }

  // キーボードを押したときの処理
  window.addEventListener('keydown', e => {
    if(gameOver){
      return;
    }

    switch(e.keyCode){
      case 37://左
        if(checkMoveable(-1, 0)) tetrominoX--;
        break;
      case 38://上
        roopDown();
        break;
      case 39://右
        if(checkMoveable(1, 0)) tetrominoX++;
        break;
      case 40://下
        if(checkMoveable(0, 1)) tetrominoY++;
        break;
      case 32://スペース
        let newTetromino = rotate();
        if(checkMoveable(0, 0, newTetromino)) tetromino = newTetromino;
        break;
    }
    draw();
  });

  // 初期状態
  initialField();
  scoreWindow();
  ntetroWindow();
  playBtn.classList.remove('inactive');

  let pressTime;

  // プレイボタンを押したときの処理
  playBtn.addEventListener('click', () => {
    if(selectComp){
      return;
    }
    switch(selectNum){
      case 0://Easy
        dropInterval = 500;
        break;
      case 1://Normal
        dropInterval = 300;
      break;
      case 2://Hard
        dropInterval = 150;
        break;
      default:
        checkMessage.textContent = '難易度が選択されていません';
        return;
    }
    pressTime = Date.now();
    gameOver = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    initialField();
    initial();
    scoreWindow();
    ntetroWindow();
    initialTetromino();
    countTimer();
    playBtn.classList.add('inactive');
    selectComp = true;
    message.textContent = 'ベストスコアを出せるよう頑張りましょう!';
  });

  // 開始前のカウントダウン
  function countTimer() {
    ctx.clearRect(0, 0, fieldWidth, fieldHeight);
    const countTime = 3.4 * 1000;
    const threeCount = pressTime + countTime - Date.now();
    let text;
    ctx.font = '40px Arrial';
    let textX = fieldWidth / 2;
    let textY = fieldHeight / 2 - 20;
    ctx.lineWidth = 5;
    ctx.fillStyle = 'white';

    if((threeCount / 1000).toFixed(0) < 1){
      text = 'START';
      ctx.strokeText(text, textX, textY);
      ctx.fillText(text, textX, textY);
    }
    else{
      text = (threeCount / 1000).toFixed(0);
      ctx.strokeText(text, textX, textY);
      ctx.fillText(text, textX, textY);
    }
    
    const counttimeoutId = setTimeout(() => {
      countTimer();
    }, 10);

    if(threeCount < -0.6 * 1000){
      clearTimeout(counttimeoutId);
      draw();
      dropTetoromino();
      showScore(0);
    }
  }

})();