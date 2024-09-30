let numOfFloors, numOfLifts, liftData = [], distanceArray = [], pendingLiftCalls = [], liftTimings = [], buttonTracker = [];
const floorHeightValue = -160;
let timers = {}, timerCount = 0;

function displayError(msg) {
    const errorDiv = document.createElement('div');
    errorDiv.id = 'err';
    errorDiv.classList.add('absolute', 'border', 'rounded-md', 'p-4', 'bg-red-500/60', 'bottom-0', 'right-0', 'm-4');
    errorDiv.innerText = msg;
    document.body.appendChild(errorDiv);
}

document.getElementById('create').addEventListener('click', initializeLifts);

function initializeLifts() {
    document.querySelector("#game").innerHTML = "";
    for(let i=0; i<timerCount; i++) {
        clearTimeout(timers[i]);
    }
    timers = {};
    numOfFloors=0, numOfLifts=0, liftData = [], distanceArray = [], pendingLiftCalls = [], liftTimings = [], buttonTracker = [];

    const existingError = document.getElementById('err');
    if (existingError) {
        existingError.remove();
    }

    numOfLifts = parseInt(document.getElementById('lifts').value);
    numOfFloors = parseInt(document.getElementById('floors').value);

    if (numOfFloors < 1 || numOfLifts < 1 || isNaN(numOfLifts) || isNaN(numOfFloors)) {
        displayError(`Required : 
            Lift count > 0
            Floor count > 0`);
        return;
    }

    const liftWidthCalc = 3 + 1.75 * 2;
    const containerWidth = (liftWidthCalc * (numOfLifts + 2));
    document.querySelector("#game").style.width = `${containerWidth}rem`;

    function setupSimulator() {
        if (numOfFloors < 0) {
            const n = Number(numOfFloors) + 1;
            for (i = -1; i > numOfFloors; i--) {
                createFloorStructure(numOfFloors, numOfLifts, i);
            }
        } else if (numOfFloors > 0) {
            const n = numOfFloors - 1;
            for (i = n; i >= 0; i--) {
                createFloorStructure(numOfFloors, numOfLifts, i);
            }
        }

        for (i = 0; i < numOfLifts; i++) {
            const liftElement = document.createElement("div");
            liftElement.setAttribute('class', 'lifts w-14 h-24 m-6 flex overflow-hidden border-y-8 border-x-4 border-black rounded-sm');
            liftElement.classList.add(`lift-${i}`);
            document.querySelector(".lift-container").appendChild(liftElement);
            const doorElement = document.createElement("div");
            doorElement.setAttribute('class', 'liftDoor w-full h-full opacity-70');
            doorElement.classList.add(`liftDoor${i}`);
            liftElement.appendChild(doorElement);
            const liftInstance = document.querySelector(`.lift-${i}`);
            liftInstance.dataset.currentFloor = 0;
            liftInstance.style.transform = `translateY(0px)`;
            let key = `currentFloor`;
            liftData.push({ [key]: `${liftInstance.dataset.currentFloor}`, Status: 1, time: 0 });
        }
    }

    setupSimulator();

    const mainButton = document.querySelector(".main");

    for (i = 0; i <= numOfFloors * 2; i++) {
        document.querySelectorAll(".liftCall")[i].addEventListener("click", (event) => {
            const buttonClass = event.target.classList[1];
            const buttonFloorNumber = Number(buttonClass.split("-")[1]);
            const pixelValue = (buttonFloorNumber) * floorHeightValue;
            const liftIndex = findNearestLift(liftData, buttonFloorNumber);
            if (liftData[liftIndex].Status != false) {
                moveLiftToFloor(liftIndex, buttonFloorNumber, buttonClass, pixelValue);
            } else {
                pendingLiftCalls.push(buttonFloorNumber);
                document.querySelector(`.${buttonClass}`).disabled = true;
                buttonTracker.push(buttonClass);
            }
        });
    }

    for (i = 0; i >= numOfFloors * 2; i--) {
        document.querySelectorAll(".liftCall")[Math.abs(i)].addEventListener("click", (event) => {
            const buttonClass = event.target.classList[1];
            const buttonFloorNumber = Number(buttonClass.split("-")[1]);
            const pixelValue = (buttonFloorNumber) * -floorHeightValue;
            const liftIndex = findNearestLift(liftData, buttonFloorNumber);
            if (liftData[liftIndex].Status != false) {
                moveLiftToFloor(liftIndex, buttonFloorNumber, buttonClass, pixelValue);
            } else {
                pendingLiftCalls.push(buttonFloorNumber);
                document.querySelector(`.${buttonClass}`).disabled = true;
                buttonTracker.push(buttonClass);
            }
        });
    }
}

function createFloorStructure(totalFloors, totalLifts, i) {
    const floorDiv = document.createElement("div");
    floorDiv.classList.add("floorDiv", `floorDiv-${i}`, 'h-40', 'border-b-4', 'border-black');
    const n = totalFloors - 1;
    const floorLabel = document.createElement("p");
    floorLabel.classList.add('absolute', 'top-16', 'left-40', 'font-extrabold', 'opacity-15', 'text-6xl', 'h-6');
    if (i == 0) {
        if (totalFloors < 0) floorDiv.classList.add("basement");
        const textNode = document.createTextNode(`Ground`);
        floorLabel.appendChild(textNode);
        floorDiv.appendChild(floorLabel);
        createUpButton(floorDiv, i);
        const liftContainer = document.createElement("div");
        liftContainer.setAttribute('class', 'flex flex-row relative left-36 bottom-14');
        liftContainer.classList.add("lift-container");
        floorDiv.appendChild(liftContainer);
    } else if (i == n) {
        const textNode = document.createTextNode(`Level-${n}`);
        floorLabel.appendChild(textNode);
        floorDiv.appendChild(floorLabel);
        createDownButton(floorDiv, i);
    } else {
        const textNode = document.createTextNode(`Level-${i}`);
        floorLabel.appendChild(textNode);
        floorDiv.appendChild(floorLabel);
        createUpButton(floorDiv, i);
        createDownButton(floorDiv, i);
    }
    document.querySelector("#game").appendChild(floorDiv);
}

function createUpButton(floorDiv, index) {
    index = Math.abs(index);
    const upBtn = document.createElement("button");
    upBtn.innerHTML = "△";
    upBtn.type = "button";
    upBtn.classList.add("liftCall", `up-${index}`, 'h-12', 'w-12', 'mx-2', 'rounded-full', 'border', 'border-gray-500', 'hover:bg-sky-400/65', 'font-black');
    floorDiv.appendChild(upBtn);
}

function createDownButton(floorDiv, index) {
    index = Math.abs(index);
    const downBtn = document.createElement("button");
    downBtn.innerHTML = "▽";
    downBtn.classList.add("liftCall", `down-${index}`, 'h-12', 'w-12', 'rounded-full', 'border', 'border-gray-500', 'hover:bg-sky-400/65', 'font-black');
    floorDiv.appendChild(downBtn);
}

function findNearestLift(liftArray, targetFloor) {
    distanceArray = [];
    liftTimings = [];
    liftArray.map((lift) => {
        if (lift.Status == false) {
            liftTimings.push(lift.time);
            distanceArray.push(1000);
        } else {
            distanceArray.push(Math.abs(lift.currentFloor - targetFloor));
        }
    });
    const minDistance = Math.min(...distanceArray);
    return distanceArray.indexOf(minDistance);
}

function moveLiftToFloor(liftIndex, targetFloor, buttonClass, translateYValue) {
    const selectedLift = document.querySelector(`.lift-${liftIndex}`);
    const previousFloor = parseInt(liftData[liftIndex].currentFloor);
    const travelTime = 2 * (Math.abs(targetFloor - previousFloor));
    selectedLift.dataset.currentFloor = `${targetFloor}`; 
    selectedLift.style.transitionDuration = `${travelTime}s`;
    selectedLift.style.transform = `translateY(${translateYValue}px)`;
    liftData[liftIndex].currentFloor = selectedLift.dataset.currentFloor;
    liftData[liftIndex].Status = 0;
    document.querySelector(`.${buttonClass}`).disabled = true;
    let totalWaitTime = (travelTime + 5) * 1000;
    liftData[liftIndex].time = totalWaitTime;

    timers[timerCount++] = setTimeout(() => {
        const door = document.querySelector(`.liftDoor${liftIndex}`);
        door.style.width = "0%";
    }, travelTime * 1000);
    timers[timerCount++] = setTimeout(() => {
        const door = document.querySelector(`.liftDoor${liftIndex}`);
        door.style.width = "100%";
    }, (travelTime + 2.5) * 1000);
    timers[timerCount++] = setTimeout(() => {
        document.querySelector(`.${buttonClass}`).disabled = false;
        liftData[liftIndex].Status = true;
        if (pendingLiftCalls.length > 0) {
            handlePendingCalls(liftIndex);
        }
    }, totalWaitTime);
}


function handlePendingCalls(liftIndex) {
    const pendingRequest = pendingLiftCalls.shift();
    moveLiftToFloor(liftIndex, pendingRequest, buttonTracker.shift(), pendingRequest * floorHeightValue);
}
