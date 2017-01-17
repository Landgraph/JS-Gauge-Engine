/*
    Базовый класс двигателя
*/
function landBoatEngine(settings)
{
    if(!settings) settings={};
    
    this.state = settings.state? settings.state:0;
    this.maxRPM = settings.maxRPM? settings.maxRPM:5000;
    this.workRPM = settings.workRPM? settings.workRPM:800;
    this.RPM = this.state==0? 0:this.workRPM;
    this.zones = new landWorkZones(0, 'yellow').next(600, 'empty').next(this.maxRPM-2000, 'yellow')
                 .next(this.maxRPM-1000, 'red').end(this.maxRPM);
    this.worker = settings.worker? settings.worker:null;
    
    /*
        Изменение частоты двигателя
    */    
    this.changeRPM = function(value)
    {
        if(this.state==0) {
            this.RPM = 0;
            return;
        }
        this.RPM += value;
        if(this.RPM<this.workRPM) {
            this.RPM = this.workRPM;
        }
        if(this.RPM>this.maxRPM) {
            this.RPM = this.maxRPM;
        }
    }
    
    /*
        Изменения состояния двигателя: вкл или выкл
    */
    this.changeState = function(state)
    {
        switch(state) {
            case false:
            case 'off':
            case 0:
                this.RPM = 0;
                this.state = 0;
                if(this.workerInt) {
                    clearInterval(this.workerInt);
                    this.workerInt = null;
                }
                break;
            case true:
            case 'on':
            case 1:
                this.RPM = this.workRPM;
                this.state = 1;
                if(!this.workerInt)
                    this.workerInt = setInterval(this.worker, 1000);
                break;                
        }
    }
}

/*
    Базовый класс корабля
*/
function landBoat(settings)
{
    if(!settings) settings={};
    
    this.angle = settings.angle? settings.angle:0;
    this.speed = settings.speed? settings.speed:0;
    this.engine = settings.engine? settings.engine:new landBoatEngine();
    this.fuelTank = settings.fuelTank? settings.fuelTank:10;
    this.fuel = settings.fuel? settings.fuel:5;
    
    
    this.rpmGauge = new landGauge({id:'rpm', width:150, height:150, unitName:'RPM', min:0, max:this.engine.maxRPM, workZones:this.engine.zones, position:this.engine.RPM, subSteps:3});
    this.fuelGauge = new landGauge({id:'fuel', width:150, height:150, unitName:'L', min:0, max:this.fuelTank, workZones:new landWorkZones(0,'red').next(this.fuelTank*0.1, 'empty').end(this.fuelTank), position:this.fuel, subSteps:4});
    this.speedGauge = new landRoundGauge({id:'speed', size:300, unitName:'km/h', min:0, max:40, steps:7});
    this.compass = new landCompass({id:'compass', size:300, position: this.angle});
    
    this.getRPMGauge = function(){return this.rpmGauge;}
    this.getFuelGauge = function(){return this.fuelGauge;}
    this.getSpeedGauge = function(){return this.speedGauge;}
    this.getCompass = function(){return this.compass;}
    this.updateSpeed = function(){this.speed = 40/this.engine.maxRPM*this.engine.RPM;}
    
    var boat = this;
    
    /*
        Обработка работы двигателя (сжигание топлива)
    */
    this.engine.worker = function()
    {
        boat.fuel -= boat.engine.RPM/60*0.001;
        if(boat.fuel<=0) {
            boat.engine.changeState('off');
            boat.fuel = 0;
        }
        boat.fuelGauge.position = boat.fuel;
        if(boat.fuelLevelChange)
            boat.fuelLevelChange();
        if(boat.fuel>0)
            engine.draw(boat.fuelGauge);
        else {
            boat.changeRPM();
            engine.draw();
            if(boat.fuelEmpty) {
                boat.fuelEmpty();
            }
        }
    }
    
    /*
        Заправка судна
    */
    this.refuel = function(value)
    {
        if(value<0) return;
        this.fuel+=value;
        if(this.fuel>this.fuelTank)
            this.fuel = this.fuelTank;
        this.fuelGauge.position = this.fuel;
        engine.draw(this.fuelGauge);
        if(boat.fuelLevelChange)
            boat.fuelLevelChange();
    }
    
    /*
        Изменение частоты работы двигателя
    */
    this.changeRPM = function(value)
    {
        this.engine.changeRPM(value);
        this.rpmGauge.position = this.engine.RPM;
        this.updateSpeed();
        this.speedGauge.position = this.speed;
        engine.draw();
    }
    
    /*
        Поворот налево
    */
    this.turnLeft = function()
    {
        //При неработающем двигателе не меняем направление
        if(this.engine.state!=1) return;
        this.angle -= 5;
        this.compass.position = this.angle;
        engine.draw();
    }

    /*
        Поворот направо
    */
    this.turnRight = function()
    {
        //При неработающем двигателе не меняем направление
        if(this.engine.state!=1) return;
        this.angle += 5;
        this.compass.position = this.angle;
        engine.draw();
    }
}
