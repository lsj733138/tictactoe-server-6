const { v4 : uuidv4 } = require('uuid');

module.exports = function(server)
{

    // socket 생성
    const io = require('socket.io')(server , {
        transports: ['websocket'],
    });
    
    // 방 정보를 저장할 배열
    var rooms = []; // 빈방이 있는지 없는지 판단하기 위한 배열, 빈방이 아니게 되면 배열에서 삭제
    var socketRooms = new Map(); // 접속한 클라이언트가 어떤 방에 들어가있는지 저장
    
    // 클라이언트로부터 호출을 받았을 때 동작
    io.on('connection', function(socket) { // socket -> client
        console.log('a user connected');
        
        if (rooms.length > 0) {
            var roomId = rooms.shift(); // 배열에서 값을 빼서 가져옴
            socket.join(roomId);
            socket.emit('joinRoom', { roomId: roomId });
            socket.to(roomId).emit('startGame', { socketId: roomId });
            socketRooms.set(socket.id, roomId);
        } else {
            var roomId = uuidv4(); // 중복되지 않는 방 이름 반환
            socket.join(roomId);
            socket.emit('createRoom', { roomId: roomID }); // createRoom이라는 메시지 전달, 만든 방 아이디 전달
            rooms.push(roomId);
            socketRooms.set(socket.id, roomId);
        }
        
        socket.on('leaveRoom', function(data) {
            // 특정 클라이언트가 방을 나갔을 때
            var roomId = data.roomId;
            socket.leave(roomId);
            socket.emit('exitRoom');
            socket.to(roomId).emit('endGame');
    
            // 방 만든 후 혼자 들어갔다 나갈 때 방 정보 삭제
            const roomIdx = rooms.indexOf(roomId);
            if (roomIdx !== -1) {
                rooms.splice(roomIdx, 1);
                console.log('Room removed:', roomId);
            }
    
            socketRooms.delete(socket.id);
        });
        
        // 끊겼을 때 로그 남기기
        socket.on('disconnecting', function() {
            console.log('Disconnected : ' + socket.id + ', Reason : ' + reason); 
        });
        
        socket.on('doPlayer', function(playerInfo) {
            var roomId = playerInfo.roomId;
            var cellIndex = playerInfo.position;
            
            console.log('doPlayer : ' + roomId + ', cellIndex: ' + cellIndex);
            socket.to(roomId).emit('doOpponent', { position: cellIndex });
        });
    });
}