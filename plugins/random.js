/*
 * Random plugin
 *   - choose: Choose between one of n options
 *   - dice: Roll n dice with x sides 
 *   - roll: Roll between 1 and n(n defaults to 100)
 */
var Random = function() {
  this.commands = ['choose', 'dice', 'roll'];
  this.usage = {
    choose: 'ex: !choose code, sleep. Chooses randomly between a list of choices.',
    dice: 'ex: !dice <n>d<x>. Rolls n x-sided dices.',
    roll: 'ex: !roll <num>. Rolls between 1 and num. num defaults to 100.' 
  };
};


/*
 * Helper function that returns a random number between min and max(inclusive)
 */
var getRandom = function(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};


/*
 * Choose command
 */
Random.prototype.choose = function(bot, to, from, msg, callback) {
  var choices = msg.split(','),
      winningChoice;

  if (choices.length === 1 && choices[0] === '') {
    bot.say(to, 'I need something to choose from.');
    callback();
    return;
  }

  // Trim leading and trailing whitespace
  winningChoice = choices[getRandom(0, choices.length - 1)].replace(/^\s\s*/, '').replace(/\s\s*$/, '');

  bot.say(to, 'I choose ' + winningChoice);
  callback();
};


/*
 * Dice command
 */
Random.prototype.dice = function(bot, to, from, msg, callback) {
  var ii,
      roll = 0,
      dice = msg.split('d');

  if (dice.length === 1 && dice[0] === '') {
    // default to a single six-sided die
    dice = [1, 6];
  } else if (dice.length !== 2 || isNaN(parseInt(dice[0])) || isNaN(parseInt(dice[1]))) {
    bot.say(to, "Woops! I'm expecting <number of dice>d<number of sides>.");
    callback();
    return;
  }

  for (ii = 0; ii < dice[0]; ii++) {
    roll += getRandom(1, dice[1]);
  }

  bot.say(to, from + " rolled a " + roll);
  callback();
};


/*
 * Roll command
 */
Random.prototype.roll = function(bot, to, from, msg, callback) {
  var max = parseInt(msg);

  if (isNaN(max)) {
    max = 100;
  }

  bot.say(to, from + " rolled a " + getRandom(1, max));
  callback();
};


exports.Plugin = Random;
