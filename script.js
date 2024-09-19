const holdDoor = 2500, timeBwEachFloor = 2000;
let currState = [];
let pendingRequests = { up: [], down: [] };
let liftBusy = [];
let floorQ = { up: new Set(), down: new Set() };

document.getElementById('create').addEventListener('click', startTheGame);

function errorToast(val) {
    const err = document.createElement('div');
    err.id = 'err';
    err.classList.add('absolute', 'border', 'rounded-md', 'p-4', 'bg-red-500/60', 'bottom-0', 'right-0', 'm-4')
    err.innerText = val;
    document.body.appendChild(err);
}


function startTheGame() {
    const err = document.getElementById('err');
    if (err) {
        err.remove();
    }

    const totalFloors = parseInt(document.getElementById('floors').value);
    const totalLifts = parseInt(document.getElementById('lifts').value);

    if (totalFloors < 1 ||
        totalLifts < 1 ||
        isNaN(totalLifts) ||
        isNaN(totalFloors)) {
        errorToast(`Required : 
            Lift count > 0
            Floor count > 0`);
        return;
    }

    const game = document.getElementById('game');
    game.innerHTML = '';

    currState = Array(totalLifts).fill(1);
    liftBusy = Array(totalLifts).fill(false);
    floorQ = { up: new Set(), down: new Set() };


    for (let i = 1; i <= totalFloors; i++) {
        const floor = document.createElement('div');
        floor.classList.add('floor', 'p-4', 'gap-1', 'h-40', 'flex', 'flex-col', 'w-full', 'justify-center', 'items-start', 'relative', 'border-t-2', 'border-black');
        floor.dataset.floor = i;

        const floorButtons = document.createElement('div');
        floorButtons.classList.add('flex', 'flex-col', 'relative');

        const floorNum = document.createElement('div');
        floorNum.classList.add('text-6xl', 'opacity-15', 'absolute', 'top-10', 'left-[40rem]', 'font-bold');
        floorNum.innerText = `${i === 1 ? 'Ground' : `Level-${i - 1}`}`


        const upButton = document.createElement('button');
        const downButton = document.createElement('button');
        upButton.innerHTML = "<img src='./up-button.png' class='h-14 w-14 p-1 rounded-full hover:bg-sky-600/70'>";
        downButton.innerHTML = "<img src='./up-button.png' class='h-14 w-14 p-1 rounded-full rotate-180 hover:bg-sky-600/70'>";
        upButton.classList.add('up', `${i === totalFloors && 'opacity-10'}`);
        downButton.classList.add('down', `${i === 1 && 'opacity-10'}`);
        if (i !== totalFloors) {
            upButton.onclick = () => {
                requestLift(i, 'up');
                upButton.disabled = true
                setTimeout(() => upButton.disabled = false, 2*holdDoor+500)
            }
        }
        if (i !== 1) {
            downButton.onclick = () => {
                requestLift(i, 'down');
                downButton.disabled = true
                setTimeout(() => downButton.disabled = false, 2*holdDoor+500)
            }
        }
        floorButtons.appendChild(upButton);
        floorButtons.appendChild(downButton);

        floor.appendChild(floorButtons);
        floor.appendChild(floorNum)
        game.appendChild(floor);
    }


    for (let i = 0; i < totalLifts; i++) {
        const lift = document.createElement('div');
        lift.classList.add('lift', 'w-20', 'h-32', 'absolute', 'm-3', 'border-y-[1.2rem]', 'border-x-4', 'border-black', 'rounded-sm', 'justify-center', 'items-center', 'flex', 'bottom-0', '-z-10')
        lift.dataset.lift = i;
        lift.style.transform = `translateY(0px)`;
        lift.style.left = `${(i * 120) + 100}px`;
        game.firstChild.appendChild(lift);
    }
}



function requestLift(floor, dir) {
    if (floorQ[dir].has(floor)) {
        return;
    }

    floorQ[dir].add(floor);
    pendingRequests[dir].push(floor);
    nextInSeq(dir);
}


function nextInSeq(dir) {
    if (pendingRequests[dir].length === 0) return;

    const floor = pendingRequests[dir].shift();
    const lifts = document.querySelectorAll('.lift');
    const targetY = -(floor - 1) * 160;
    let closestLift = null;
    let minDistance = Infinity;

    lifts.forEach(lift => {
        const liftIndex = parseInt(lift.dataset.lift);
        const currentFloor = currState[liftIndex];
        const isBusy = liftBusy[liftIndex];
        const distance = Math.abs(currentFloor - floor);

        if (distance < minDistance && !isBusy) {
            closestLift = lift;
            minDistance = distance;
        }
    });

    if (closestLift) {
        const liftIndex = parseInt(closestLift.dataset.lift);
        liftBusy[liftIndex] = true;
        closeDoorsAndMove(closestLift, liftIndex, floor, targetY, dir);
    } else {
        pendingRequests[dir].push(floor);
        setTimeout(() => nextInSeq(dir), 1000);
    }
}



function moveLift(lift, liftIndex, targetFloor, target, dir) {
    const currentFloor = currState[liftIndex];
    const floorsToMove = Math.abs(currentFloor - targetFloor);
    const moveTime = floorsToMove * timeBwEachFloor;

    lift.style.transition = `transform ${moveTime}ms linear`;
    lift.style.transform = `translateY(${target}px)`;
    currState[liftIndex] = targetFloor;

    setTimeout(() => {
        openDoors(lift, liftIndex, targetFloor, dir);
    }, moveTime);
}


function closeDoorsAndMove(whichLift, idx, dest, target, dir) {
    if (whichLift.classList.contains('door-open')) {
        closeDoors(whichLift, idx, () => moveLift(whichLift, idx, dest, target, dir));
    } else {
        moveLift(whichLift, idx, dest, target, dir);
    }
}

function closeDoors(lift, liftIndex, callback = null) {
    if (lift.classList.contains('door-open')) {
        lift.classList.remove('door-open');
    }

    setTimeout(() => {
        liftBusy[liftIndex] = false;
        if (callback) callback();
        setTimeout(() => nextInSeq('up'), 500);
        setTimeout(() => nextInSeq('down'), 500);
    }, holdDoor);
}

function openDoors(lift, liftIndex, targetFloor, dir) {
    if (!lift.classList.contains('door-open')) {
        lift.classList.add('door-open');

        setTimeout(() => {
            floorQ[dir].delete(targetFloor);
            closeDoors(lift, liftIndex);
        }, holdDoor);
    }
}

