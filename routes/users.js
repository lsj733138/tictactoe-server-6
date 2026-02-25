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

// 로그인
router.post('/signin', async function(req, res, next) {
  try {
    var username = req.body.username;
    var password = req.body.password;
    
    // 입력값 검증
    if (!username || !password) {
        return res.status(400).json({message : 'All fields are required'});
    }
    
    // DB 연결
    var database = req.app.get('database');
    var users = database.collection('users');
    
    //사용자 조회
    const existingUser = await users.findOne({ username : username });
    if (existingUser) {
        var compareResult = await bcrypt.compareSync(password, existingUser.password);
        if(compareResult) {
            // 세션에 사용자 정보 저장
            req.session.isAuthenticated = true;
            req.session.userId = existingUser._id.toString();
            req.session.username = existingUser.username;
            req.session.nickname = existingUser.nickname;
            
            res.status(200).json({ message : 'Login successful.', user : existingUser });
        } else {
            res.status(401).json({ message : 'Invalid password.'});
        }
    } else {
        res.status(404).json({ message: 'User not found. '});
    }
  } catch (error) {
    res.status(500).json({message: 'Internal server error.'});
  }
});

// 로그 아웃
router.post('/signout', function(req, res, next) {
  if (req.session) {
    // 세션 삭제
    req.session.destroy(function(err) {
      if (err) {
        return res.status(500).json({ message: 'Internal server error'});
      } else {
        return res.status(200).json({ message: 'Logout successful. '});
      }
    });
  } else {
    res.status(400).json({ message: 'No active session. '});
  }
});

// 점수 추가
router.post('/addscore', async function(req, res, next) {
  try {
    if (!req.session.isAuthenticated) {
      return res.status(401).json({ message: 'Unauthorized.' });
    }

    var userId = req.session.userId;
    var score = req.body.score;

    // 점수 유효성 검사
    if (!score || isNaN(score)) {
      return res.status(400).send({ message: 'Invalid score.' });
    }

    // DB 연결
    var database = req.app.get('database');
    var users = database.collection('users');

    // DB 점수 업데이트
    const result = await users.updateOne({ _id: new ObjectId(userId) }, { $set: { score: Number(score), updatedAt: new Date() } });

    res.status(200).json({ message: 'Score added successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// 점수 불러오기
router.get('/score', async function(req, res, next) {
  try {
    // 로그인 확인
    if (!req.session.isAuthenticated) {
      return res.status(401).json({ message: 'Unauthorized.' });
    }

    // 세션에서 사용자 ID 가져오기
    var userId = req.session.userId;

    // DB 연결
    var database = req.app.get('database');
    var users = database.collection('users');

    // DB에서 해당 사용자의 정보 가져오기
    const user = await users.findOne({ _id: new ObjectId(userId) });

    // 사용자 정보가 없으면 404 오류 반환
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // 점수 반환
    res.status(200).json({ score: user.score });

  } catch (error) {
    res.status(500).json({ message: 'Internal server error.' });
  }
});

module.exports = router;
