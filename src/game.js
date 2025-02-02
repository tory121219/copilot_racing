// src/game.js

class Game {
    constructor() {
        this.isRunning = false;
        this.lastTime = 0;
        this.gameState = {
            currentScreen: 'start', // 'start', 'playing', 'gameover'
            score: 0,
            isGameOver: false,
            obstacles: [],
            playerName: '',
            level: 1,
            rankings: this.loadRankings()
        };
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Set canvas size
        this.canvas.width = 800;
        this.canvas.height = 600;

        // 플레이어 자동차 초기 상태
        this.player = {
            x: 400,
            y: 500,
            width: 50,
            height: 80,
            speed: 5,
            moveLeft: false,
            moveRight: false
        };

        // 키보드 이벤트 리스너 설정
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        document.addEventListener('keyup', this.handleKeyUp.bind(this));

        // 장애물 생성 간격 (밀리초)
        this.obstacleInterval = 2000;
        this.lastObstacleTime = 0;

        // 난이도 설정
        this.difficultySettings = {
            baseInterval: 2000,    // 처음 장애물 생성 간격 (2초)
            baseSpeed: 2,          // 처음 장애물 속도
            initialObstacles: 2,   // 시작시 최대 장애물 수
            maxObstacles: 8,       // 최대 장애물 수
            difficultyInterval: 5000, // 난이도 증가 간격 (5초)
            lastDifficultyIncrease: 0, // 마지막 난이도 증가 시간
            currentDifficultyLevel: 0,  // 현재 난이도 레벨
            maxDifficultyLevel: 10      // 최대 난이도 레벨
        };

        // UI 요소
        this.startScreen = document.getElementById('startScreen');
        this.startButton = document.getElementById('startButton');
        this.playerNameInput = document.getElementById('playerName');

        // 이벤트 리스너
        this.startButton.addEventListener('click', () => this.startGame());

        // 이미지 로딩 부분 제거하고 색상 설정 추가
        this.colors = {
            road: '#404040',
            roadLine: '#FFFFFF',
            player: '#FF0000',
            obstacle: '#0000FF',
            grass: '#228B22'
        };

        // 도로 설정 수정
        this.road = {
            x: 200,          // 도로 시작 x 좌표
            width: 400,      // 기본 도로 폭
            baseWidth: 400,  // 기준 도로 폭
            minWidth: 300,   // 최소 도로 폭
            maxWidth: 500,   // 최대 도로 폭
            baseX: 200,      // 기준 도로 시작점
            minX: 100,       // 최소 도로 시작점
            maxX: 300,       // 최대 도로 시작점
            changeInterval: 3000, // 변경 간격
            lastChange: 0,    // 마지막 변경 시간
            targetX: 200,    // 목표 X 위치
            targetWidth: 400 // 목표 폭
        };

        // 도로 변경 타입
        this.roadChangeTypes = ['moveLeft', 'moveRight', 'narrow', 'widen'];

        // 장애물 종류 추가
        this.obstacleTypes = [
            {
                type: 'car',
                width: 40,
                height: 60,
                speed: 1,
                score: 10,
                color: '#0000FF',
                draw: this.drawCar.bind(this)
            },
            {
                type: 'truck',
                width: 50,
                height: 100,
                speed: 0.8,
                score: 15,
                color: '#804000',
                draw: this.drawTruck.bind(this)
            },
            {
                type: 'motorcycle',
                width: 30,
                height: 40,
                speed: 1.4,
                score: 20,
                color: '#FF0000',
                draw: this.drawMotorcycle.bind(this)
            }
        ];
    }

    loadRankings() {
        const rankings = localStorage.getItem('raceGameRankings');
        return rankings ? JSON.parse(rankings) : [];
    }

    saveRanking() {
        const newRanking = {
            name: this.gameState.playerName,
            score: this.gameState.score,
            date: new Date().toLocaleDateString()
        };
        
        this.gameState.rankings.push(newRanking);
        this.gameState.rankings.sort((a, b) => b.score - a.score);
        this.gameState.rankings = this.gameState.rankings.slice(0, 5); // Top 5만 유지
        
        localStorage.setItem('raceGameRankings', JSON.stringify(this.gameState.rankings));
    }

    init() {
        // alert 메시지 제거하고 이미 입력된 이름 사용
        this.isRunning = true;
        this.gameState.score = 0;
        this.gameState.isGameOver = false;
        this.gameState.obstacles = [];
        this.gameState.level = 1;
        this.gameState.currentScreen = 'playing';
        this.lastObstacleTime = 0;
        this.difficultySettings.currentDifficultyLevel = 0;
        this.difficultySettings.lastDifficultyIncrease = 0;
        this.gameLoop(0);
    }

    handleKeyDown(event) {
        if (event.code === 'Space') {
            if (this.gameState.currentScreen === 'start' || 
                this.gameState.currentScreen === 'gameover') {
                this.init();
                return;
            }
        }
        switch(event.key) {
            case 'ArrowLeft':
                this.player.moveLeft = true;
                break;
            case 'ArrowRight':
                this.player.moveRight = true;
                break;
        }
        if (event.code === 'Space' && this.gameState.isGameOver) {
            this.init(); // 게임 재시작
        }
    }

    handleKeyUp(event) {
        switch(event.key) {
            case 'ArrowLeft':
                this.player.moveLeft = false;
                break;
            case 'ArrowRight':
                this.player.moveRight = false;
                break;
        }
    }

    startGame() {
        const playerName = this.playerNameInput.value.trim();
        if (!playerName) {
            alert('Please enter your name!');
            return;
        }
        this.gameState.playerName = playerName;
        this.startScreen.classList.add('hidden');
        this.init();
    }

    createObstacle() {
        // 랜덤하게 장애물 타입 선택
        const typeIndex = Math.floor(Math.random() * this.obstacleTypes.length);
        const type = this.obstacleTypes[typeIndex];
        const baseSpeed = this.difficultySettings.baseSpeed * 
                         (1 + (this.difficultySettings.currentDifficultyLevel * 0.2));

        // 도로 안에서만 장애물 생성
        const minX = this.road.x + 20;
        const maxX = this.road.x + this.road.width - type.width - 20;
        
        const obstacle = {
            ...type,
            x: minX + Math.random() * (maxX - minX),
            y: -50,
            speed: type.speed * baseSpeed
        };
        
        const currentMaxObstacles = Math.min(
            this.difficultySettings.initialObstacles + 
            Math.floor(this.difficultySettings.currentDifficultyLevel / 2),
            this.difficultySettings.maxObstacles
        );

        const currentSpeed = this.difficultySettings.baseSpeed * 
            (1 + (this.difficultySettings.currentDifficultyLevel * 0.2));

        if (this.gameState.obstacles.length < currentMaxObstacles) {
            this.gameState.obstacles.push(obstacle);
        }
    }

    checkCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }

    gameLoop(timestamp) {
        if (!this.isRunning) return;

        const deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;

        this.update(deltaTime);
        this.render();

        requestAnimationFrame(this.gameLoop.bind(this));
    }

    update(deltaTime) {
        if (this.gameState.currentScreen !== 'playing') return;
        if (this.gameState.isGameOver) {
            this.saveRanking();
            this.gameState.currentScreen = 'gameover';
            return;
        }

        // 시간 기반 난이도 증가
        const currentTime = Date.now();
        if (currentTime - this.difficultySettings.lastDifficultyIncrease > 
            this.difficultySettings.difficultyInterval) {
            
            if (this.difficultySettings.currentDifficultyLevel < 
                this.difficultySettings.maxDifficultyLevel) {
                this.difficultySettings.currentDifficultyLevel++;
                this.difficultySettings.lastDifficultyIncrease = currentTime;
            }
        }

        // 난이도에 따른 장애물 생성 간격 조정
        this.obstacleInterval = this.difficultySettings.baseInterval * 
            Math.max(0.6, 1 - (this.difficultySettings.currentDifficultyLevel * 0.08));

        // 플레이어 이동 업데이트
        if (this.player.moveLeft && this.player.x > 200) {
            this.player.x -= this.player.speed;
        }
        if (this.player.moveRight && this.player.x < 600 - this.player.width) {
            this.player.x += this.player.speed;
        }

        // 새로운 장애물 생성
        if (Date.now() - this.lastObstacleTime > this.obstacleInterval) {
            this.createObstacle();
            this.lastObstacleTime = Date.now();
        }

        // 장애물 업데이트
        for (let i = this.gameState.obstacles.length - 1; i >= 0; i--) {
            const obstacle = this.gameState.obstacles[i];
            obstacle.y += obstacle.speed;

            // 충돌 체크
            if (this.checkCollision(this.player, obstacle)) {
                this.gameState.isGameOver = true;
                return;
            }

            // 화면을 벗어난 장애물 제거 및 점수 추가
            if (obstacle.y > this.canvas.height) {
                this.gameState.obstacles.splice(i, 1);
                this.gameState.score += 10;
            }
        }

        // 도로 변경 업데이트
        if (currentTime - this.road.lastChange > this.road.changeInterval) {
            this.changeRoad();
            this.road.lastChange = currentTime;
        }

        // 도로 부드러운 변경과 충돌 감지 개선
        const prevX = this.road.x;
        const prevWidth = this.road.width;
        
        this.road.x += (this.road.targetX - this.road.x) * 0.02;
        this.road.width += (this.road.targetWidth - this.road.width) * 0.02;

        // 도로 변경에 따른 플레이어와 장애물 위치 조정
        if (prevWidth !== this.road.width || prevX !== this.road.x) {
            // 도로 중앙 기준 상대 위치 계산
            const roadCenter = prevX + (prevWidth / 2);
            const newRoadCenter = this.road.x + (this.road.width / 2);
            const widthRatio = this.road.width / prevWidth;

            // 플레이어 위치 조정
            const playerOffsetFromCenter = (this.player.x + (this.player.width / 2)) - roadCenter;
            const newPlayerOffset = playerOffsetFromCenter * widthRatio;
            this.player.x = (newRoadCenter + newPlayerOffset) - (this.player.width / 2);

            // 장애물 위치도 같은 비율로 조정
            this.gameState.obstacles.forEach(obstacle => {
                const obstacleOffsetFromCenter = (obstacle.x + (obstacle.width / 2)) - roadCenter;
                const newObstacleOffset = obstacleOffsetFromCenter * widthRatio;
                obstacle.x = (newRoadCenter + newObstacleOffset) - (obstacle.width / 2);
            });
        }

        // 충돌 체크 개선
        for (let i = this.gameState.obstacles.length - 1; i >= 0; i--) {
            const obstacle = this.gameState.obstacles[i];
            obstacle.y += obstacle.speed;

            // 도로 경계 내에 있는 장애물만 충돌 체크
            if (obstacle.x >= this.road.x && 
                obstacle.x + obstacle.width <= this.road.x + this.road.width) {
                
                if (this.checkCollision(this.player, obstacle)) {
                    // 추가 검증: 실제 겹침 영역 계산
                    const overlap = this.getCollisionOverlap(this.player, obstacle);
                    if (overlap.width > 5 && overlap.height > 5) { // 최소 겹침 임계값
                        this.gameState.isGameOver = true;
                        return;
                    }
                }
            }

            // 화면을 벗어난 장애물 제거 및 점수 추가
            if (obstacle.y > this.canvas.height) {
                this.gameState.obstacles.splice(i, 1);
                this.gameState.score += 10;
            }
        }

        // 플레이어 이동 업데이트
        const moveSpeed = this.player.speed;
        if (this.player.moveLeft) {
            this.player.x = Math.max(
                this.road.x + 10, // 왼쪽 도로 경계 + 여유 공간
                this.player.x - moveSpeed
            );
        }
        if (this.player.moveRight) {
            this.player.x = Math.min(
                this.road.x + this.road.width - this.player.width - 10, // 오른쪽 도로 경계 - 여유 공간
                this.player.x + moveSpeed
            );
        }

        // 플레이어가 도로 밖으로 나가지 않도록 제한
        this.player.x = Math.max(
            this.road.x + 10,
            Math.min(
                this.player.x,
                this.road.x + this.road.width - this.player.width - 10
            )
        );
    }

    // 충돌 영역 계산 함수 추가
    getCollisionOverlap(rect1, rect2) {
        const x1 = Math.max(rect1.x, rect2.x);
        const x2 = Math.min(rect1.x + rect1.width, rect2.x + rect2.width);
        const y1 = Math.max(rect1.y, rect2.y);
        const y2 = Math.min(rect1.y + rect1.height, rect2.y + rect2.height);

        return {
            width: Math.max(0, x2 - x1),
            height: Math.max(0, y2 - y1)
        };
    }

    changeRoad() {
        // 랜덤하게 도로 변경 타입 선택
        const changeType = this.roadChangeTypes[Math.floor(Math.random() * this.roadChangeTypes.length)];
        
        switch(changeType) {
            case 'moveLeft':
                this.road.targetX = Math.max(this.road.minX, this.road.baseX - 100);
                this.road.targetWidth = this.road.width;
                break;
            case 'moveRight':
                this.road.targetX = Math.min(this.road.maxX, this.road.baseX + 100);
                this.road.targetWidth = this.road.width;
                break;
            case 'narrow':
                this.road.targetWidth = Math.max(this.road.minWidth, this.road.baseWidth - 100);
                break;
            case 'widen':
                this.road.targetWidth = Math.min(this.road.maxWidth, this.road.baseWidth + 100);
                break;
        }
    }

    render() {
        this.ctx.fillStyle = '#87CEEB';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        if (this.gameState.currentScreen === 'start') {
            this.renderStartScreen();
        } else if (this.gameState.currentScreen === 'playing') {
            this.renderGame();
        } else if (this.gameState.currentScreen === 'gameover') {
            this.renderGameOver();
        }
    }

    renderStartScreen() {
        this.ctx.fillStyle = 'black';
        this.ctx.font = '48px Arial';
        this.ctx.fillText('Racing Game', 300, 200);
        
        this.ctx.font = '24px Arial';
        this.ctx.fillText('How to Play:', 300, 280);
        this.ctx.fillText('← → : Move car left/right', 300, 320);
        this.ctx.fillText('Avoid blue cars and survive!', 300, 360);
        this.ctx.fillText('Press SPACE to start', 300, 420);
    }

    renderGame() {
        // 잔디 배경
        this.ctx.fillStyle = this.colors.grass;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 도로 그리기
        this.ctx.fillStyle = this.colors.road;
        this.ctx.fillRect(this.road.x, 0, this.road.width, this.canvas.height);

        // 도로 경계선
        this.ctx.strokeStyle = this.colors.roadLine;
        this.ctx.lineWidth = 5;
        this.ctx.setLineDash([20, 20]);
        
        // 왼쪽 경계선
        this.ctx.beginPath();
        this.ctx.moveTo(this.road.x, 0);
        this.ctx.lineTo(this.road.x, this.canvas.height);
        this.ctx.stroke();
        
        // 오른쪽 경계선
        this.ctx.beginPath();
        this.ctx.moveTo(this.road.x + this.road.width, 0);
        this.ctx.lineTo(this.road.x + this.road.width, this.canvas.height);
        this.ctx.stroke();

        // 중앙선
        this.ctx.beginPath();
        this.ctx.moveTo(this.road.x + this.road.width/2, 0);
        this.ctx.lineTo(this.road.x + this.road.width/2, this.canvas.height);
        this.ctx.stroke();
        
        this.ctx.setLineDash([]);

        // 장애물 그리기
        for (const obstacle of this.gameState.obstacles) {
            obstacle.draw(
                obstacle.x, 
                obstacle.y, 
                obstacle.width, 
                obstacle.height, 
                obstacle.color
            );
        }

        // 플레이어 자동차 그리기
        this.drawCar(this.player.x, this.player.y, this.player.width, this.player.height, this.colors.player);

        // UI 정보
        this.ctx.fillStyle = 'white';
        this.ctx.strokeStyle = 'black';
        this.ctx.lineWidth = 3;
        this.ctx.font = 'bold 24px Arial';
        
        const texts = [
            `Player: ${this.gameState.playerName}`,
            `Score: ${this.gameState.score}`,
            `Difficulty: ${this.difficultySettings.currentDifficultyLevel + 1}`
        ];

        texts.forEach((text, i) => {
            this.ctx.strokeText(text, 20, 30 + i * 30);
            this.ctx.fillText(text, 20, 30 + i * 30);
        });
    }

    // 자동차 아이콘 그리기 함수 추가
    drawCar(x, y, width, height, color) {
        this.ctx.save();
        this.ctx.fillStyle = color;
        
        // 차체
        this.ctx.fillRect(x + width * 0.1, y + height * 0.2, width * 0.8, height * 0.6);
        
        // 위쪽 차체
        this.ctx.fillRect(x + width * 0.25, y + height * 0.1, width * 0.5, height * 0.3);
        
        // 바퀴
        this.ctx.fillStyle = '#000000';
        // 왼쪽 바퀴들
        this.ctx.fillRect(x, y + height * 0.15, width * 0.15, height * 0.2);
        this.ctx.fillRect(x, y + height * 0.65, width * 0.15, height * 0.2);
        // 오른쪽 바퀴들
        this.ctx.fillRect(x + width * 0.85, y + height * 0.15, width * 0.15, height * 0.2);
        this.ctx.fillRect(x + width * 0.85, y + height * 0.65, width * 0.15, height * 0.2);
        
        // 창문
        this.ctx.fillStyle = '#87CEEB';
        this.ctx.fillRect(x + width * 0.3, y + height * 0.15, width * 0.4, height * 0.2);

        this.ctx.restore();
    }

    drawCurvedRoad() {
        const roadSegments = 20;
        const segmentHeight = this.canvas.height / roadSegments;
        
        for (let i = 0; i < roadSegments; i++) {
            const perspectiveOffset = this.road.offset * (i / roadSegments);
            const segmentWidth = this.road.width * (1 - i * 0.03);
            
            // 도로 그리기
            this.ctx.fillStyle = this.colors.road;
            this.ctx.fillRect(
                200 + perspectiveOffset - (segmentWidth * 0.1),
                i * segmentHeight,
                segmentWidth,
                segmentHeight + 1
            );

            // 도로 중앙선
            if (i % 2 === 0) {
                this.ctx.fillStyle = this.colors.roadLine;
                this.ctx.fillRect(
                    400 + perspectiveOffset - 2,
                    i * segmentHeight,
                    4,
                    segmentHeight / 2
                );
            }
        }
    }

    // 새로운 장애물 그리기 함수들
    drawTruck(x, y, width, height, color) {
        this.ctx.save();
        this.ctx.fillStyle = color;
        
        // 트럭 본체
        this.ctx.fillRect(x + width * 0.1, y + height * 0.3, width * 0.8, height * 0.7);
        // 운전석
        this.ctx.fillRect(x + width * 0.2, y + height * 0.1, width * 0.4, height * 0.2);
        
        // 바퀴 (더 큰 바퀴)
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(x, y + height * 0.25, width * 0.2, height * 0.25);
        this.ctx.fillRect(x, y + height * 0.75, width * 0.2, height * 0.25);
        this.ctx.fillRect(x + width * 0.8, y + height * 0.25, width * 0.2, height * 0.25);
        this.ctx.fillRect(x + width * 0.8, y + height * 0.75, width * 0.2, height * 0.25);
        
        this.ctx.restore();
    }

    drawMotorcycle(x, y, width, height, color) {
        this.ctx.save();
        this.ctx.fillStyle = color;
        
        // 바퀴
        this.ctx.fillStyle = '#000000';
        this.ctx.beginPath();
        this.ctx.arc(x + width * 0.3, y + height * 0.7, height * 0.25, 0, Math.PI * 2);
        this.ctx.arc(x + width * 0.7, y + height * 0.7, height * 0.25, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 차체
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x + width * 0.2, y + height * 0.3, width * 0.6, height * 0.2);
        
        // 운전자
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(x + width * 0.3, y, width * 0.2, height * 0.3);
        
        this.ctx.restore();
    }

    renderGameOver() {
        // 반투명 오버레이
        this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 게임오버 메시지
        this.ctx.fillStyle = 'white';
        this.ctx.strokeStyle = 'red';
        this.ctx.lineWidth = 2;
        this.ctx.font = 'bold 48px Arial';
        this.ctx.textAlign = 'center';
        
        this.ctx.strokeText('GAME OVER', this.canvas.width/2, 200);
        this.ctx.fillText('GAME OVER', this.canvas.width/2, 200);

        // 최종 점수
        this.ctx.font = 'bold 32px Arial';
        this.ctx.fillText(`Final Score: ${this.gameState.score}`, this.canvas.width/2, 260);

        // 랭킹 표시
        this.ctx.font = 'bold 24px Arial';
        this.ctx.fillText('Top 5 Rankings', this.canvas.width/2, 320);
        
        this.gameState.rankings.slice(0, 5).forEach((rank, index) => {
            const rankText = `${index + 1}. ${rank.name}: ${rank.score}`;
            this.ctx.fillText(rankText, this.canvas.width/2, 360 + index * 30);
        });

        this.ctx.font = '20px Arial';
        this.ctx.fillText('Press SPACE to play again', this.canvas.width/2, 520);
    }

    stop() {
        this.isRunning = false;
    }
}

const game = new Game();
game.init();