'use strict'
 
// Создаем двумерный массив из элементов td
const box = [].map.call(document.querySelectorAll('.game-row'),elem => elem.querySelectorAll('td')); 
const startButton = document.querySelector('.start-button');
const testShuffleButton = document.querySelector('.test-shuffle');
const timer = document.querySelector('.timer');
const stepCounter = document.querySelector('.step-counter');
const closeButton = document.querySelector('.button--close');
const submitWindow = document.querySelector('.blackout')
const resultsTable = document.querySelector('#results-table')

const gameResults = document.querySelector('#game-results');
const email = gameResults.email;
const username = gameResults.username;

const maxRows = box.length;
const maxColumns = box[0].length;
const lastCell = createCell(3,3).getCell()


// Функции Старт/Стоп
const counter = new MakeCounter(); //создаем счетчик

const reset = () => {
  startButton.value = 'start';
  startButton.innerHTML = 'Старт';
  initialState(box); // Возвращаем начальное состояние игрового поля
  
  timer.textContent = '0:00'; // Сбрасываем значение таймера
  stepCounter.textContent = counter.reset(); // Сбрасываем значение счетчика
  document.querySelector('.empty-cell').classList.remove('empty-cell'); //Удаляем класс пустой ячейки
  lastCell.classList.add('empty-cell');
}

const stop = () => {
  clock.stop(); // Останавливаем таймер
  for (let i = 0; i < box.length; i++) {
    for (let j = 0; j < box[i].length; j++) {
      let cell = createCell(i,j);
      cell.getCell().onclick = null; // Удаляем обработчик событий для ячеек
    };
  };
}

const start = () => {

  startButton.value = 'stop';
  startButton.innerHTML = 'Стоп'; 
  startButton.disabled = true; // На время перемешивания блокируем кнопку "Старт/стоп"
  // Перемешиваем коробку
  new Promise ((resolve, reject) => {

                testShuffleButton.checked ? sortCells(1, createCell(3, 3), createCell(0, 0), resolve) : 
                                            sortCells(50, createCell(3, 3), createCell(0, 0), resolve);
                           
    }).then(() => clock.start(timer) // Запускаем таймер после перемешивания
  
    ).then (() => {
      for (let i = 0; i < box.length; i++) {
        for (let j = 0; j < box[i].length; j++) {
          let cell = createCell(i,j);
          cell.getCell().onclick = () => { // Добавляем обработчик событий для ячеек

            if (makeAMove(cell)) stepCounter.textContent = counter.step(); // Пытаемся сделать шаг, если получилось увеличиваем счетчик
            if (isWin(box)) { // Проверка на верную комбинацию и остановка
              submitWindow.style = 'display: block;' // Вызов окна отправки формы
              stop();
            } 
          };
        };
      }
    }).then(() => startButton.disabled = false)
}


// ** Обработчики **


// Обработчик отправки формы
gameResults.onsubmit = () => { 

  saveResults(username.value, email.value, timer.textContent, stepCounter.textContent); // СДобавляем результаты в массив объектов в лок. хранилище
  
  clearTable(); // Очищаем таблицу от результатов, иначе она добавляет результаты к существующим
  insertTable (getResults(localStorage.results)); // обновляем таблицу  
  resultsTable.rows[1].style="background-color: orange"; // окрашиваем последний резуьтат
  submitWindow.style = 'display: none;'; // Закрываем всплывающее окно отправки результатов
  reset(); // cбрасываем счетчики
  document.location.href = './index.html#pop-up-field'; // переходим на окно результатов
  return false;
}


window.onload = () => insertTable (getResults(localStorage.results)); // Заполняем таблицу из лок. хранилища.
testShuffleButton.onchange = () => {}; // Вешаем обработчик на чекбокс для запуска для тестирования
closeButton.onclick = () => submitWindow.style = "display: none;"; // Закрываем всплывающее окно отправки результатов

// запуск по кнопке старт
startButton.onclick = () => {

  if (startButton.value == 'start') {
    start();
  } else {
    stop();
    reset();
  };
}



//** Функции игры **

function move (cell1, cell2) { // Возвращает true, если сделан ход. Меняет местами значения в ячейках 2(пустого) с 1

  const cellValue = cell2.getCell().textContent;
  cell2.getCell().classList.remove('empty-cell');
  cell2.getCell().textContent = cell1.getCell().textContent;

  cell1.getCell().classList.add('empty-cell')
  cell1.getCell().textContent = cellValue;
  return true;  
}

// Определяем возможность сделать ход и делаем его
function makeAMove (cell) {

  const x = cell.x;
  const y = cell.y;

  return isEmpty(createCell(y-1,x)) ? move (cell, createCell(y-1,x)) :
         isEmpty(createCell(y+1,x)) ? move (cell, createCell(y+1,x)) :
         isEmpty(createCell(y,x-1)) ? move (cell, createCell(y,x-1)) :
         isEmpty(createCell(y,x+1)) ? move (cell, createCell(y,x+1)) : null;                     
}

// Определяем возможность сделать ход 
function getPossibleSteps(cell) {

  const x = cell.x;
  const y = cell.y;
  return [createCell(y-1, x),createCell(y+1, x),
          createCell(y, x-1),createCell(y, x+1)].filter(elem => !isEmpty(elem) && elem.getCell() != null)  
}

// Сортировка ячеек путем перемешивания между собой 
function sortCells (steps, cell, previousCell, resolve) {
  
  const possibleCells = getPossibleSteps(cell).filter(e => e.getCell() != previousCell.getCell()); // Убираем возможность ходить назад
  const nextCell = possibleCells[randomInteger(0, possibleCells.length-1)];

  if (steps < 1) {
    resolve();
    return;
  };
  move(nextCell, cell);
  setTimeout(() => sortCells((steps-1), nextCell, cell, resolve), 20);// Задержку можно убрать, добавлена для наглядности
}


// Проверяем пустая ли ячейка
function isEmpty (cell) {

  if (cell.getCell() == null) return null; // Если ввели неверные координаты при созданнии ячейки, ячейка = null
  return cell.getCell().textContent == ' ';
}

// Проверка на правильную комбинацию
function isWin (box) {

  let array = box.map(e => Array.from(e)).flat().map(e => e.textContent).join('');
  return array == '123456789101112131415 ';
}

// Возвращаем к начальному состоянию, присваивая значения ячейкам
function initialState (box) {

  const arr = ['1','2','3','4','5','6','7','8','9','10','11','12','13','14','15',' '];

  let k = 0;
  for (let i = 0; i < box.length; i++) {
    for (let j = 0; j < box[i].length; j++) {     
      createCell(i,j).getCell().textContent = arr[k];
      k++;
    };
  };
}

// Таймер, принимает html елемент, куда будет записываться таймер.
const clock = {

  render () {
    this.timePassed = Date.now() - this.startTime;
  },  
  start (elem) {
    this.startTime = Date.now(),
    this.render();
    this.timer = setInterval(() => {
      this.render();
      this.setTime(elem);
    }, 1000);
  },
  stop () {    
    clearInterval(this.timer);
  },
  setTime (e) {
    let minutes = Math.floor(this.timePassed / 60000);
    let seconds = ((this.timePassed % 60000) / 1000).toFixed(0);
    return e.textContent = minutes + ':' + (seconds < 10 ? '0' : '') + seconds;
  }
}

// конструктор счетчика
function MakeCounter() {
  
  this.count = 0;
  this.step = () => this.count += 1;
  this.reset = () => this.count = 0
}

// конструктор ячейки, принимает координаты ячейки, при неверном значении возвращает null
function Cell (y,x) { 

  this.x = x;
  this.y = y;
  this.getCell = () => {
    if (this.y < 0 || this.y >= maxRows || 
        this.x < 0 || this.x >= maxColumns) return null;
    return box[y][x];
  }  
}


function createCell (y,x) {
  return new Cell (y,x);
} 

function randomInteger(min, max) {
  // Случайное число от min до (max+1)
  const rand = min + Math.random() * (max + 1 - min);
  return Math.floor(rand);
}

//** Функции сохранения/возврата результатов **

// Сохраняем результаты в виде массива объектов в localStorage.results
function saveResults(name, email, time, steps) { 
  
  let result = {
    name,
    email,
    time,
    steps,
    date: new Date(),
  };

  let results = getResults(localStorage.results);

  if (results.length >= 10) results.pop(); 

  results.unshift(result);
  
  localStorage.results = JSON.stringify(results)
}

// Получаем результате в формате массива объектов из строки
// Использование: getResults (localStorage.results)
function getResults (str) {
  if (str) {
    let results = JSON.parse(str, function(key, value) {
      if (key == 'date') return new Date(value);
      return value;
    });
    return results;
  } else {
    return []; // Возвращаем пустой массив, если ничего нет.
  }
  
}


// 
function clearTable() {
  let table = document.querySelector('#results-table')
  while(table.rows.length > 1) {
    table.deleteRow(1);
  }
}


function insertTable (array) {

  if ('content' in document.createElement('template')) {

    let template = document.querySelector('#resultsthrow');
    let td = template.content.querySelectorAll('.record');
    let tb = document.querySelector('#results-table').tBodies

    array.map((element) => {
      td[0].textContent = element.name;
      td[1].textContent = element.email;
      td[2].textContent = element.time;
      td[3].textContent = element.steps;
      td[4].textContent = formatDate(element.date);
      let clone = document.importNode(template.content, true);
      tb[0].appendChild(clone);
    });  

  } else {
    console.log('браузер не справился')
  }

}


function formatDate(date) {
  
  let dd = date.getDate();
  if (dd < 10) dd = '0' + dd;

  let mm = date.getMonth() + 1;
  if (mm < 10) mm = '0' + mm;

  let yy = date.getFullYear() % 100;
  if (yy < 10) yy = '0' + yy;

  return dd + '.' + mm + '.' + yy;
}


//** Функции валидации** пока не добавлены

// function validateEmail(email) {
//   const re = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/;
//   return re.test(String(email).toLowerCase());
// }

// function validateName(name) {
//   const re = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/;
//   return re.test(String(name).toLowerCase());
// }