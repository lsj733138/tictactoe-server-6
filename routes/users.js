var express = require('express');
var router = express.Router();
var bcrypt = require('bcrypt');
const { ObjectId } = require('mongoDb');

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

// 회원가입
router.post('/signup', async function(req, res, next) {
  try {
    var username = req.body.username;
    var password = req.body.password;
    var nickname = req.body.nickname;

    // 입력값 검증
    if (!username || !password || !nickname) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    // DB 연결
    var database = req.app.get('database');
    var users = database.collection('users');

    // 중복된 username 확인
    var existingUser = await users.findOne({ username: username });
    if (existingUser) {
      return res.status(409).json({ message: 'Username already exists.' });
    }

    // 비밀번호 암호화
    var salt = await bcrypt.genSalt(10);
    var hashedPassword = await bcrypt.hash(password, salt);

    // 사용자 정보 저장
    var newUser = {
      username: username,
      password: hashedPassword,
      nickname: nickname,
      createdAt: new Date()
    };
    await users.insertOne(newUser);

    res.status(201).json({ message: 'User registered successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error.' });
  }
});

module.exports = router;
