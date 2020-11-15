const oInput = document.getElementById("idSearch");
const oFileInput = document.getElementById("idFile");
oInput.addEventListener("keyup", function onKeyUp(event) {
  if (event.keyCode === 13) {
    // Cancel the default action, if needed
    event.preventDefault();
    // Trigger the button element with a click
    search();
  }
});
function search()
{
    console.clear();
    let sPattern = oInput.value;
    if (!sPattern) {
      console.log("Please enter a search string");
      return;
    }
    let file = oFileInput.files[0];
    let reader = new FileReader();
    if (!file) {
      console.log("Please select a text file");
      return;
    }
    reader.readAsText(file);
    reader.onload = () => {
      let data = reader.result.match(/^.*[^\r\n]$/mg).filter((s) => !s.match(/^\/\//) && !s.match(/^[\s]*$/g));
      let aResults = _search(data, sPattern);
      let iMax = Math.max.apply(null, aResults.map((s) => s.score));
      function format({ text: t, score: s}) { return { text: t, score: Math.round10(s, -2) }; }
      console.table(aResults.map(format));
      console.table(aResults.filter((res) => res.score >= iMax).map(format));
    }
}
function decimalAdjust(type, value, exp) {
  // Если степень не определена, либо равна нулю...
  if (typeof exp === 'undefined' || +exp === 0) {
    return Math[type](value);
  }
  value = +value;
  exp = +exp;
  // Если значение не является числом, либо степень не является целым числом...
  if (isNaN(value) || !(typeof exp === 'number' && exp % 1 === 0)) {
    return NaN;
  }
  // Сдвиг разрядов
  value = value.toString().split('e');
  value = Math[type](+(value[0] + 'e' + (value[1] ? (+value[1] - exp) : -exp)));
  // Обратный сдвиг
  value = value.toString().split('e');
  return +(value[0] + 'e' + (value[1] ? (+value[1] + exp) : exp));
}

Math.round10 = function(value, exp) {
  return decimalAdjust('round', value, exp);
};

function getScore(token, word) {
  let _word = word;
  let _token = token;
  let score = 0;
  while (_token.length && _word.length) {
    let _match = _word.match(_token[0]);
    if (_match) {
      _word = _word.slice(_match.index + 1);
      score += 1;
    }
    _token = _token.slice(1);
  }
  return score / word.length;
}
function _search(data, sPattern) {
  let tokens = sPattern && sPattern.toLowerCase().match(/(\w+)/g) || [];
  let _data = data.map((s) => s.toLowerCase().match(/(\w+)/g));
  let commonWords = _data[0].reduce((res, word, index) => {
    if (_data.filter((words) => words[index] === word).length === _data.length) {
      res.push(word);
    }
    return res;
  }, []);
  let foundWords = [];
  tokens = tokens.reduce((res, token) => {
    let _foundWords = commonWords.filter((word) => getScore(token, word) >= 0.7);
    if (_foundWords.length) {
      _foundWords.forEach((_foundWord) => {
        if (foundWords.indexOf(_foundWord) === -1) foundWords.push(_foundWord);
      });
    } else {
      res.push(token);
    }
    return res;
  }, []);
  console.log(`common: ${commonWords.join(" ")}`);
  console.log(`found: ${foundWords.join(" ")}`);
  if (!tokens.length) {
    return data.map((text, i) => {
      return {
        text: text,
        score: 1
      };
    });
  }
  console.log(`tokens: ${tokens.join(" ")}`);
  _data = _data.map((words) => {
      return commonWords.reduce((_newWords, commonWord) => {
        let index = _newWords.indexOf(commonWord);
        if (index > -1 && foundWords.indexOf(commonWord) > -1 || !foundWords.length) _newWords.splice(index, 1);
        return _newWords;
      }, words);
  });
  // console.table(_data.map((words) => words.join(" ")));
  let scores = getScores(_data, tokens);
  let found = !!scores.filter((score) => score > 0.6).length;
  return data.map((text, i) => {
    return {
      text: text,
      score: found ? scores[i] : 1
    };
  });
}

function getScores(_data, tokens) {
  let patternWeight = 1 / tokens.join("").length;
  // console.table(_data.map((words) => {
  //   let textLength = words.join("").length;
  //   let _tab = { text: words.join(" ") };
  //   tokens.forEach((token) => {
  //     _tab[token] = words.reduce((r, word) => {
  //       let _score = getScore(token, word) * token.length * patternWeight * word.length / textLength;
  //       return Math.round10(_score, -3) + r;
  //     }, 0);
  //   });
  //   return _tab;
  // }));
  console.table(_data.map((words) => {
    let textLength = words.join("").length;
    let _tab = { text: words.join(" ") };
    tokens.forEach((token) => {
      _tab[token] = words.reduce((r, word) => {
        let _score = getScore(token, word) * word.length / textLength;
        return Math.round10(_score, -3) + r;
      }, 0);
    });
    return _tab;
  }));
  let scores = _data.map((words) => {
    let textLength = words.join("").length;
    return words.map((word) => {
      // let _score = tokens.reduce((res, token) => res + getScore(token, word) * token.length * patternWeight, 0);
      let _score = tokens.reduce((res, token) => res + getScore(token, word), 0);
      return _score * word.length / textLength;
    }).reduce((res, _score) => res + _score);
  });
  let max = Math.max.apply(null, scores);
  let r = scores.map((s) => Math.round10(s / max, -3));
  console.log(r);
  return scores;
}
