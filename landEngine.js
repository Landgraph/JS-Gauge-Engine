/*
  Объект движка
  
  Отвечает за первичную инициализацию переменных
*/
function landEngine(id) {
    this.canvas = document.getElementById(id?id:'viewport');
    this.width = this.canvas.width;
    this.height = this.canvas.height;
    this.ctx = null;
    
    try {
        this.ctx = this.canvas.getContext('2d');
    }
    catch(e) {}
    if(!this.ctx) { alert('Не удалось инициализировать Canvas'); }
    
    this.scene = null;
    var self = this;

    /*
        Отложенной инициализации (пока не нужна)
    */
    this.init = function ()
    {
        if(!this.ctx) return false;
        
        return true;
    }
    
    /*
        Отображение
    */
    this.draw = function(item)
    {
        if(!item)
            this.ctx.clearRect(0,0,this.width,this.height);
        if(this.scene)
            this.scene.drawScene(item);
    }
    
    /*
        Обработка нажатия на холст
    */
    function onclick(evt)
    {
        var e=evt?evt:window.event;
        var t=e.target? e.target:e.srcElement;
        if(!self.scene) return;
        var x = e.offsetX;
        var y = e.offsetY;
        var item = self.scene.getXY(x, y);
        if(item && item.click) {
            item.click();    
        }       
    }

    this.canvas.addEventListener('click', onclick);
    
}

/*
  Объект сцены
*/
function landScene()
{
    this.items = new Array(); 
    this.x = 0;
    this.y = 0;
    this.xScale = 1.0;
    this.yScale = 1.0;
    
    /*
        Добавление объекта на сцену.
        Возврат: объект
    */
    this.add = function(item)
    {
        this.items[this.items.length] = item;
        return item;
    }
    
    /*
        Получение объекта сцены по его id.
        Возврат: объект или null
    */
    this.get = function(id)
    {
        if(!id) return null;
        for(var i=0; i<this.items.length; i++) {
            if(this.items[i].id==id) return this.items[i];
        }
        return null;
    }

    /*
        Получение объекта, которому принадлежат координаты X,Y.
        Возврат: объект или null
    */
    this.getXY = function(x,y)
    {
        var bX = (x-this.x)/this.xScale, bY=(y-this.y)/this.yScale;
        for(var i=this.items.length-1; i>=0; i--) {
            if(this.items[i].checkBounds(bX,bY))
                return this.items[i];
        }
        return null;
    }
    
    /*
        Отображение сцены
    */
    this.drawScene = function(item)
    {
        var ctx = engine.ctx;
        ctx.translate(this.x, this.y);
        ctx.scale(this.xScale, this.yScale);
        if(typeof item == 'undefined') {
            for(var i=0; i<this.items.length; i++) {
                this.items[i].drawObject();
            }
        } else {
            for(var i=0; i<this.items.length; i++) {
                if(this.items[i] == item)
                    this.items[i].drawObject();
            }
        }
        ctx.scale(1.0/this.xScale, 1.0/this.yScale);
        ctx.translate(-this.x, -this.y);
    }
    
    /*
        Для возможности отрисовки сцены в сцене
    */
    this.drawObject = this.drawScene;
}

/*
    Класс, определяющий набор и цвет рабочих зон на индикаторе.
    Если не нужно заливать цветом - цвет 'empty'.
    Пример, раскраска зон 3000-3500 тысячи оборотов двигателя жёлтым, дальше - красным
    var zones = landWorkZones(3000, 'yellow').next(3500, 'red').end(4000);
*/
function landWorkZones(value, color)
{
    this.zones = new Array({v:value,c:color});
    this.self = this;
    
    this.next = function(value, color)
    {
        this.zones[this.zones.length] = {v:value,c:color};
        return this;
    }
    
    this.end = function(value) {
        this.zones[this.zones.length] = {v:value,c:null};
        return this;
    }
}

/*
    Базовый объект сцены.
    Инициализируются основные параметры объекта сцены.
    Предоставляются методы рисования объекта на сцене,
    его перемещения, определения x,y в зоне объекта.
*/
function landSceneObject(settings)
{
    if(!settings) settings={};
    
    this.x = settings.x? settings.x:0;
    this.y = settings.y? settings.y:0;
    this.id = settings.id? settings.id:null;
    this.click = settings.click? settings.click:null;
    this.workZones = settings.workZones? settings.workZones:null;
    
    this.drawObject = function()
    {
        var ctx = engine.ctx;
        ctx.translate(this.x, this.y);
        
        this.draw();
        
        ctx.translate(-this.x, -this.y);
    }
    
    this.move = function(x,y)
    {
        this.x += x;
        this.y += y;
        return this;
    }
    
    this.checkBounds = function(x,y)
    {
     return (this.x<x)
        && ((this.x+this.width)>x)
        &&  (this.y<y)
        && ((this.y+this.height)>y);
    }
}

/*
    Демо-объект. Рисует прямоугольник заданного цвета.
    Доступные свойства:
    x
    y
    width
    height
    color
    
    Пример создания:
    var quad = new landQuad({x:10, y:20, width: 100, height: 200, color: 'red'});
*/
function landQuad(settings)
{   
    landSceneObject.call(this, settings);
    if(!settings) settings={};
    
    this.width = settings.width? settings.width:100;
    this.height = settings.height? settings.height:100;
    this.color = settings.color? settings.color:'#FFDDDD';    

    this.draw = function()
    {
        var ctx = engine.ctx;
        
        ctx.fillStyle = this.color;
        ctx.fillRect(0,
                     0,
                     this.width,
                     this.height);
    }
}

/*
    Надпись. Рисует табличку с надписью.
    Доступные свойства:
    x
    y
    width
    height
    bgColor - цвет фона таблички
    fgColor - цвет текста таблички
    text - текст таблички
    align - выравнивание текста ('left', 'center', 'right')
    size - размер текста в пикселях
    
    Пример создания:
    var obj = new landLabel({x:10, y:20, width: 100, height: 20, bgColor: 'white',
                             fgColor:'black',text:'Test Label',align:'center'});
*/
function landLabel(settings)
{
    landSceneObject.call(this, settings);
    if(!settings) settings={};
    
    this.width = settings.width? settings.width:100;
    this.size = settings.size? settings.size:12;
    this.height = settings.height? settings.height:this.size*1.2;
    this.bgColor = settings.bgColor? settings.bgColor:'white';
    this.fgColor = settings.fgColor? settings.fgColor:'green';
    this.text = settings.text? settings.text:'LABEL';
    this.align = settings.align? settings.align:'center';

    this.draw = function()
    {
        var ctx = engine.ctx;
        
        ctx.fillStyle = this.bgColor;
        ctx.fillRect(0,
                     0,
                     this.width,
                     this.height);
                     
        ctx.fillStyle = this.fgColor;
        ctx.font = this.size+'px Arial';
        var m = ctx.measureText(this.text);
        switch(this.align) {
            case 'center':
                ctx.fillText(this.text, this.width/2-m.width/2, this.size, this.width);
                break;
            case 'left':
                ctx.fillText(this.text, 0, 10, this.width);
                break;
            case 'right':
                ctx.fillText(this.text, this.width-m.width, this.size, this.width);
                break;
        }

        ctx.strokeStyle = 'silver';
        ctx.lineWidth = 2;
        ctx.strokeRect(0,
                       0,
                       this.width,
                       this.height);
                     
    }
}

/*
    Кнопка. Рисует кнопку с надписью.
    Доступные свойства:
    x
    y
    width
    height
    bgColor - цвет фона неактивной кнопки
    fgColor - цвет текста
    acColor - цвет фона нажатой кнопки
    text - текст таблички
    align - выравнивание текста ('left', 'center', 'right')
    size - размер текста в пикселях
    state - состояние кнопки (нажата или нет)
    
    Пример создания:
    var obj = new landButton({x:10, y:20, width: 100, height: 20, bgColor: 'white',
                             fgColor:'black',text:'Test Label',align:'center',click:function(){this.state=!this.state;engine.draw();}});
*/
function landButton(settings)
{
    landSceneObject.call(this, settings);
    if(!settings) settings={};
    
    this.width = settings.width? settings.width:100;
    this.size = settings.size? settings.size:12;
    this.height = settings.height? settings.height:this.size*1.2;
    this.bgColor = settings.bgColor? settings.bgColor:'white';
    this.fgColor = settings.fgColor? settings.fgColor:'green';
    this.acColor = settings.acColor? settings.acColor:'maroon';
    this.text = settings.text? settings.text:'BUTTON';
    this.align = settings.align? settings.align:'center';
    this.state = settings.state? settings.state:false;

    this.draw = function()
    {
        var ctx = engine.ctx;
        
        ctx.fillStyle = !this.state? this.bgColor:this.acColor;
        ctx.fillRect(0,
                     0,
                     this.width,
                     this.height);
                     
        ctx.fillStyle = this.fgColor;
        ctx.font = this.size+'px Arial';
        var m = ctx.measureText(this.text);
        switch(this.align) {
            case 'center':
                ctx.fillText(this.text, this.width/2-m.width/2, this.size, this.width);
                break;
            case 'left':
                ctx.fillText(this.text, 0, 10, this.width);
                break;
            case 'right':
                ctx.fillText(this.text, this.width-m.width, this.size, this.width);
                break;
        }

        ctx.strokeStyle = 'silver';
        ctx.lineWidth = 2;
        ctx.strokeRect(0,
                       0,
                       this.width,
                       this.height);
                     
    }
}

/*
    Лампочка. Рисует лампочку.
    Доступные свойства:
    x
    y
    size - диаметр лампочки (круглая)
    lightColor - цвет включенной лампочки
    darkColor - цвет выключенной лампочки
    state - состояние лампочк (включена или нет)
    
    Пример создания:
    var obj = new landBulb({x:10, y:20, size: 50, lightColor: 'red', darkColor:'maroon',
                            state: false});
*/
function landBulb(settings)
{
    landSceneObject.call(this,settings);
    if(!settings) settings={};
    
    this.width = settings.size? settings.size:50;
    this.height = settings.size? settings.size:50;
    this.lightColor = settings.lightColor? settings.lightColor:'red';
    this.darkColor = settings.darkColor? settings.darkColor:'maroon';
    this.state = settings.state? settings.state:false;

    this.draw = function()
    {
        var ctx = engine.ctx;
        
        var cX = this.width/2,
            cY = this.height/2,
            R = this.width/2;
            
        var grd;
        
        if(this.state) {
            grd = ctx.createRadialGradient(cX,cY,R*0.1, cX,cY,R);
            grd.addColorStop(0, 'white');    
            grd.addColorStop(1, this.lightColor);    
        } else {
            grd = ctx.createRadialGradient(cX,cY,R/2, cX,cY,R);
            grd.addColorStop(0, this.darkColor);    
            grd.addColorStop(1, 'black');    
        }
        
        ctx.beginPath();
        ctx.arc(cX,cY,R,0,Math.PI*2);
        ctx.fillStyle = grd;
        ctx.fill();        
        ctx.lineWidth = 3;
        ctx.strokeStyle = 'black';
        ctx.stroke();
    }
}

/*
    Тумблер. Рисует переключатель.
    Доступные свойства:
    x
    y
    width
    height
    state - состояние тумблера (включен или нет)
    
    Пример создания:
    var obj = new landTumbler({x:10, y:20, width: 50, height: 100, state: false});
*/
function landTumbler(settings)
{
    landSceneObject.call(this,settings);
    if(!settings) settings={};
    
    this.width = settings.width? settings.width:50;
    this.height = settings.height? settings.height:100;
    this.state = settings.state? settings.state:false;

    this.draw = function()
    {
        var ctx = engine.ctx;
        var grd=ctx.createLinearGradient(0,0,0,this.height);
        grd.addColorStop(0.0, 'black');    
        grd.addColorStop(0.5, 'grey');
        grd.addColorStop(1.0, 'black');
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, this.width, this.height);
        
        ctx.fillStyle = grd;
        ctx.fillRect(this.width*0.15, this.height*0.15, this.width*0.7, this.height*0.7);
        
        ctx.fillStyle = 'grey';
        ctx.font = Math.ceil(this.height*0.08)+'px Arial';
        ctx.fillText('ВЫКЛ', this.width/2-ctx.measureText('ВЫКЛ').width/2, this.height-this.height*0.02);
        ctx.fillText('ВКЛ', this.width/2-ctx.measureText('ВКЛ').width/2, this.height*0.1);
        
        ctx.strokeStyle = 'grey';
        if(this.state) {
            var x=this.width/2-this.width*0.20;
            var y=this.height*0.10;
            ctx.fillRect(x, y, this.width*0.4, this.height*0.2);
            ctx.strokeRect(x, y, this.width*0.4, this.height*0.2);
            ctx.beginPath();
            ctx.moveTo(x,this.height/2);
            ctx.lineTo(x,this.height*0.3);
            ctx.lineTo(x+this.width*0.4,this.height*0.3);
            ctx.lineTo(x+this.width*0.4,this.height/2);
            ctx.stroke();
        } else {
            var x=this.width/2-this.width*0.20;
            var y=this.height*0.70;
            ctx.fillRect(x, y, this.width*0.4, this.height*0.2);
            ctx.strokeRect(x, y, this.width*0.4, this.height*0.2);
            ctx.beginPath();
            ctx.moveTo(x,this.height/2);
            ctx.lineTo(x,this.height*0.7);
            ctx.lineTo(x+this.width*0.4,this.height*0.7);
            ctx.lineTo(x+this.width*0.4,this.height/2);
            ctx.stroke();
        }
    }
}

/*
    Горизонтальный индикатор. Рисует горизонтальный индикатор.
    Доступные свойства:
    x
    y
    width
    height
    bgColor - цвет фона
    fgColor - цвет индикатора
    max - максимальное значение
    position - текущее значение
    
    Пример создания:
    var obj = new landProgressBar({x:10, y:20, width:100, height: 20, bgColor: 'white', fgColor:'navy',
                            max: 100, position: 20});
*/
function landProgressBar(settings)
{   
    landSceneObject.call(this,settings);
    if(!settings) settings={};
    
    this.width = settings.width? settings.width:100;
    this.height = settings.height? settings.height:20;
    this.bgColor = settings.bgColor? settings.bgColor:'#DDFFDD';    
    this.fgColor = settings.fgColor? settings.fgColor:'green';
    this.max = settings.max? settings.max:100;    
    this.position = settings.position? settings.position:0;    

    this.drawBackground = function()
    {
        var ctx = engine.ctx;
        ctx.fillStyle = this.bgColor;
        ctx.fillRect(0,
                     0,
                     this.width,
                     this.height);
    }
    
    this.drawBorder = function()
    {
        var ctx = engine.ctx;
        /*
            Нарисовать рамку
        */
        ctx.beginPath();
        ctx.moveTo(0, this.height);
        ctx.lineTo(0, 0);
        ctx.lineTo(this.width, 0);
        ctx.strokeStyle = 'grey';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(this.width, 0);
        ctx.lineTo(this.width, this.height);
        ctx.lineTo(0, this.height);
        ctx.strokeStyle = 'silver';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
    
    this.drawProgress = function()
    {
        var ctx = engine.ctx;
        var pos = (this.position>this.max ? this.max:this.position) / this.max;
        ctx.fillStyle = this.fgColor;
        ctx.fillRect(0,
                     0,
                     Math.ceil(this.width*pos),
                     this.height);
    }

    this.draw = function()
    {
        var ctx = engine.ctx;
        
        var alpha = ctx.globalAlpha;
        
        /*
            Нарисовать фон только если заполнение меньше 100 процентов
        */
        if(this.position<this.max) {
            this.drawBackground();
        }
        
        /*
            Нарисовать прогресс
        */
        if(this.position>0) {
            this.drawProgress();
        }
        
        this.drawBorder();
                
        ctx.globalAlpha = alpha;
    }
}

/*
    Вертикальный индикатор. Рисует вертикальный индикатор.
    Доступные свойства:
    x
    y
    width
    height
    bgColor - цвет фона
    fgColor - цвет индикатора
    max - максимальное значение
    position - текущее значение
    
    Пример создания:
    var obj = new landProgressBar({x:10, y:20, width:20, height: 100, bgColor: 'white', fgColor:'navy',
                            max: 100, position: 20});
*/
function landVProgressBar(settings)
{   
    landProgressBar.call(this,settings);
    
    this.drawProgress = function()
    {
        var ctx = engine.ctx;
        var pos = (this.position>this.max ? this.max:this.position) / this.max;
        var ypos = Math.ceil(this.height*pos);
        ctx.fillStyle = this.fgColor;
        ctx.fillRect(0,
                     this.height - ypos,
                     this.width,
                     ypos);
    }
}

/*
    Квадратный стрелочный индикатор.
    Доступные свойства:
    x
    y
    width
    height
    bgColor - цвет фона
    fgColor - цвет индикатора
    arrowColor - цвет стрелки
    min - минимальное значение
    max - максимальное значение
    position - текущее значение
    unitName - единица измерения
    subSteps - количество промежуточных рисок
    zones - рабочие зоны индикатора
    
    Пример создания:
    var obj = new landGauge({x:50,y:60,max:4000,min:0,position:2200, unitName:"RPM", subSteps:3, size:150,
          bgColor:'black',fgColor:'white',arrowColor:'red',
          workZones: new landWorkZones(2700, 'yellow').next(3300, 'red').end(4000)
          });
*/
function landGauge(settings)
{   
    landSceneObject.call(this,settings);
    if(!settings) settings={};
    
    this.width = settings.size? settings.size:100;
    this.height = settings.size? settings.size:100;
    this.bgColor = settings.bgColor? settings.bgColor:'white';    
    this.fgColor = settings.fgColor? settings.fgColor:'green';
    this.arrowColor = settings.arrowColor? settings.arrowColor:'black';
    this.max = settings.max? settings.max:100;    
    this.position = settings.position? settings.position:0;  
    this.min = settings.min? settings.min:0;    
    this.unitName = settings.unitName? settings.unitName:100;
    this.subSteps = settings.subSteps? settings.subSteps:1;
    
    
    /*
        Отрисовка границ индикатора
    */
    this.drawBorder = function()
    {
        /*
            Нарисовать рамку
        */
        var ctx = engine.ctx;
        
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 4;
        ctx.strokeRect(0,
                       0,
                       this.width,
                       this.height);
        ctx.beginPath();
        ctx.moveTo(0, this.height);
        ctx.lineTo(0, 0);
        ctx.lineTo(this.width, 0);
        ctx.strokeStyle = 'grey';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(this.width, 0);
        ctx.lineTo(this.width, this.height);
        ctx.lineTo(0, this.height);
        ctx.strokeStyle = 'silver';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
    
    /*
        Отрисовка рабочих зон индикатора
    */    
    this.drawWorkZones = function()
    {
        if(!this.workZones || this.workZones.zones.length<2) return;
        
        /*
            Нарисовать рабочие зоны
        */
        var ctx = engine.ctx;
        
        var cX = this.width*0.9,
            cY = this.height*0.9,
            Ri = this.width*0.75,
            Ro = this.width*0.8;
            
        for(var i=1; i<this.workZones.zones.length; i++) {
            var sZone = this.workZones.zones[i-1];
            if(sZone.c=='empty') continue;
            var eZone = this.workZones.zones[i];
            var sAngle = ((sZone.v-this.min)/(this.max-this.min)*90+180)/180*Math.PI;
            var eAngle = ((eZone.v-this.min)/(this.max-this.min)*90+180)/180*Math.PI;
            ctx.fillStyle = sZone.c;
            ctx.strokeStyle = sZone.c;
            ctx.beginPath();
            ctx.moveTo(cX + Math.cos(sAngle)*Ri, cY + Math.sin(sAngle)*Ri);
            ctx.arc(cX,cY,Ro,sAngle,eAngle);
            ctx.lineTo(cX + Math.cos(eAngle)*Ri, cY + Math.sin(eAngle)*Ri);
            ctx.arc(cX,cY,Ri,eAngle,sAngle,true);
            ctx.closePath();
            ctx.fill();
        }
    }
    
    /*
        Отрисовка шкалы индикатора
    */    
    this.drawScale = function()
    {
        /*
            Нарисовать шкалу
        */
        var ctx = engine.ctx;
        
        var cX = this.width*0.9,
            cY = this.height*0.9,
            R = this.width*0.8;
            
        this.drawWorkZones();
            
        ctx.strokeStyle=this.fgColor;
        ctx.lineWidth=2;
        ctx.font = (this.width*0.06)+'px Arial';
        ctx.fillStyle = this.fgColor;
        ctx.fillText(this.min, cX - R+10, cY-2);
        ctx.fillText(this.max, cX - ctx.measureText(this.max).width, cY - R + 20);
        ctx.beginPath();
        ctx.moveTo(cX - R+10,cY);
        ctx.arc(cX,cY,R,
                Math.PI,Math.PI*1.5);
        ctx.lineTo(cX, cY-R+10);
        ctx.stroke();
        
        var stepSize = (this.max-this.min)/(this.subSteps+1);
        
        for(var i=1; i<this.subSteps+1; i++) {
            var angle = ((i*stepSize)/(this.max-this.min)*90+180)/180*Math.PI;
            ctx.beginPath();
            ctx.moveTo(cX+Math.cos(angle)*(R-R*0.1), cY+Math.sin(angle)*(R-R*0.1));
            ctx.lineTo(cX+Math.cos(angle)*R, cY+Math.sin(angle)*R);
            ctx.stroke();
        }
    }
    
    /*
        Отрисовка фона индикатора
    */    
    this.drawBackground = function()
    {
        /*
            Нарисовать фон
        */
        var ctx = engine.ctx;
        
        ctx.fillStyle = this.bgColor;
        ctx.fillRect(0,
                     0,
                     this.width,
                     this.height);
                     
        if(this.unitName!="") {
            ctx.fillStyle = this.fgColor;
            ctx.font = (this.width*0.1)+'px Arial';
            ctx.fillText(this.unitName, 10, 25);
        }
    }
    
    /*
        Отрисовка стрелки индикатора
    */
    this.drawArrow = function()
    {
        /*
           Нарисовать стрелку
        */
        var ctx = engine.ctx;
        
        var cX = this.width*0.9,
            cY = this.height*0.9,
            R = this.width*0.8;

        //Считаем угол поворота стрелки
        var pos = this.position;
        if(this.position<this.min) pos=this.min;
        if(this.position>this.max) pos=this.max;
        var angle = (((pos - this.min)/(this.max - this.min))*90+180)/180*Math.PI;
        var aX = Math.cos(angle)*(R*0.95),
            aY = Math.sin(angle)*(R*0.95);
        
        ctx.beginPath();
        ctx.moveTo(cX, cY);
        ctx.lineTo(cX+aX, cY+aY);
        ctx.strokeStyle = this.arrowColor;
        ctx.fillStyle = this.arrowColor;
        ctx.stroke();
    }

    /*
        Отрисовка индикатора
    */
    this.draw = function()
    {
        var ctx = engine.ctx;
        
        var alpha = ctx.globalAlpha;
        
        this.drawBackground();
        this.drawScale();
        this.drawArrow();
        this.drawBorder();
                
                
        ctx.globalAlpha = alpha;
    }
}

/*
    Круглый стрелочный индикатор.
    Доступные свойства:
    x
    y
    width
    height
    bgColor - цвет фона
    fgColor - цвет индикатора
    arrowColor - цвет стрелки
    min - минимальное значение
    max - максимальное значение
    position - текущее значение
    unitName - единица измерения
    steps - количество рисок индикатора
    zones - рабочие зоны индикатора
    
    Пример создания:
    var obj = new landRoundGauge({x:600,y:250,max:80,position:45, unitName:"Ps", steps:7, size:200, id:'pressure',
          bgColor: 'black', fgColor: 'white', arrowColor:'red',
          workZones: new landWorkZones(0, 'red').next(5, 'yellow').next(10,'green').next(50,'yellow').next(60,'red').end(80)
    });
*/

function landRoundGauge(settings)
{   
    landSceneObject.call(this,settings);
    if(!settings) settings={};
    
    this.width = settings.size? settings.size:100;
    this.height = settings.size? settings.size:100;
    this.bgColor = settings.bgColor? settings.bgColor:'white';    
    this.fgColor = settings.fgColor? settings.fgColor:'green';
    this.arrowColor = settings.arrowColor? settings.arrowColor:'black';
    this.max = settings.max? settings.max:100;    
    this.position = settings.position? settings.position:0;  
    this.min = settings.min? settings.min:0;    
    this.unitName = settings.unitName? settings.unitName:"";
    this.steps = settings.steps? settings.steps:12;
    
    this.cX = this.width/2;
    this.cY = this.height/2;
    this.R = this.width/2;
    
    /*
        Отрисовка границ индикатора
    */
    this.drawBorder = function()
    {
        /*
            Нарисовать рамку
        */
        var ctx = engine.ctx;
        
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(this.cX, this.cY, this.R, 0, 2*Math.PI);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.arc(this.cX, this.cY, this.R, 0, 2*Math.PI);
        ctx.strokeStyle = 'grey';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
    
    /*
        Отрисовка рабочих зон индикатора
    */    
    this.drawWorkZones = function()
    {
        if(!this.workZones || this.workZones.zones.length<2) return;
        
        /*
            Нарисовать рабочие зоны
        */
        var ctx = engine.ctx;
        
        var Ri = this.R*0.9,
            Ro = this.R;
            
        for(var i=1; i<this.workZones.zones.length; i++) {
            var sZone = this.workZones.zones[i-1];
            if(sZone.c=='empty') continue;
            var eZone = this.workZones.zones[i];
            var sAngle = ((sZone.v-this.min)/(this.max-this.min)*360+180)/180*Math.PI;
            var eAngle = ((eZone.v-this.min)/(this.max-this.min)*360+180)/180*Math.PI;
            ctx.fillStyle = sZone.c;
            ctx.strokeStyle = sZone.c;
            ctx.beginPath();
            ctx.moveTo(this.cX + Math.cos(sAngle)*Ri, this.cY + Math.sin(sAngle)*Ri);
            ctx.arc(this.cX,this.cY,Ro,sAngle,eAngle);
            ctx.lineTo(this.cX + Math.cos(eAngle)*Ri, this.cY + Math.sin(eAngle)*Ri);
            ctx.arc(this.cX,this.cY,Ri,eAngle,sAngle,true);
            ctx.closePath();
            ctx.fill();
        }
    }

    /*
        Отрисовка шкалы индикатора
    */
    this.drawScale = function()
    {
        /*
            Нарисовать шкалу
        */
        var ctx = engine.ctx;
        
        var R = this.R*0.9;
        
        this.drawWorkZones();
            
        ctx.strokeStyle=this.fgColor;
        ctx.lineWidth=2;
        ctx.font = (this.width*0.06)+'px Arial';

        ctx.beginPath();
        ctx.arc(this.cX,this.cY,R,
                0,Math.PI*2);
        ctx.stroke();

        var stepSize = (this.max-this.min)/(this.steps+1);
        
        for(var i=0; i<=this.steps; i++) {
            var angle = ((i*stepSize)/(this.max-this.min)*360+180)/180*Math.PI;
            //alert(stepSize*i);
            ctx.beginPath();
            ctx.moveTo(this.cX+Math.cos(angle)*(R-R*0.1), this.cY+Math.sin(angle)*(R-R*0.1));
            ctx.lineTo(this.cX+Math.cos(angle)*R, this.cY+Math.sin(angle)*R);
            ctx.stroke();
            ctx.fillStyle = this.fgColor;
            ctx.fillText(Math.ceil(i*stepSize), this.cX+Math.cos(angle)*R*0.8-ctx.measureText(Math.ceil(i*stepSize)).width/2, this.cY+Math.sin(angle)*R*0.8);
        }
    }
    
    /*
        Отрисовка фона индикатора
    */
    this.drawBackground = function()
    {
        /*
            Нарисовать фон
        */
        var ctx = engine.ctx;
        
        ctx.fillStyle = this.bgColor;
        ctx.beginPath();
        ctx.arc(this.cX, this.cY, this.R, 0, 2*Math.PI);
        ctx.fill();

        if(this.unitName!="") {
            ctx.fillStyle = this.fgColor;
            ctx.font = (this.width*0.1)+'px Arial';
            ctx.fillText(this.unitName, this.cX-ctx.measureText(this.unitName).width/2, this.cY+25);
        }
    }
    
    /*
        Отрисовка стрелки индикатора
    */
    this.drawArrow = function()
    {
        /*
           Нарисовать стрелку
        */
        var ctx = engine.ctx;
        
        var R = this.R*0.85;

        //Считаем угол поворота стрелки
        var pos = this.position;
        if(this.position<this.min) pos=this.min;
        if(this.position>this.max) pos=this.max;
        var angle = (((pos - this.min)/(this.max - this.min))*360+180)/180*Math.PI;
        var aX = Math.cos(angle)*R,
            aY = Math.sin(angle)*R;
        
        ctx.beginPath();
        ctx.moveTo(this.cX, this.cY);
        ctx.lineTo(this.cX+aX, this.cY+aY);
        ctx.strokeStyle = this.arrowColor;
        ctx.fillStyle = this.arrowColor;
        ctx.stroke();
    }

    /*
        Отрисовка индикатора
    */
    this.draw = function()
    {
        var ctx = engine.ctx;
        
        var alpha = ctx.globalAlpha;
        
        this.drawBackground();
        this.drawScale();
        this.drawArrow();
        this.drawBorder();
                
                
        ctx.globalAlpha = alpha;
    }
}

/*
    Круглый компас.
    Доступные свойства:
    x
    y
    width
    height
    bgColor - цвет фона
    fgColor - цвет индикатора
    arrowColor - цвет стрелки
    position - текущее значение
    zones - рабочие зоны индикатора
    
    Пример создания:
    var obj = new landRoundGauge({x:600,y:250,max:80,position:45, unitName:"Ps", steps:7, size:200, id:'pressure',
          bgColor: 'black', fgColor: 'white', arrowColor:'red',
          workZones: new landWorkZones(0, 'red').next(5, 'yellow').next(10,'green').next(50,'yellow').next(60,'red').end(80)
    });
*/
function landCompass(settings)
{   
    if(!settings) settings={};
    settings.min=0;
    settings.max=359;
    settings.unitName="";
    settings.steps=35;
    landRoundGauge.call(this,settings);
        
    /*
        Дополнительные переменные
    */
    this.cX = this.width/2;
    this.cY = this.height/2;
    this.R = this.width/2;
    
    /*
        Отрисовка шкалы прибора
    */    
    this.drawScale = function()
    {
        /*
            Нарисовать шкалу
        */
        var ctx = engine.ctx;
        
        var R = this.R*0.9;
        ctx.translate(this.cX, this.cY);
        ctx.rotate(-this.position/180*Math.PI);
        
        ctx.strokeStyle=this.fgColor;
        ctx.lineWidth=2;
        ctx.font = (this.width*0.03)+'px Arial';

        ctx.beginPath();
        ctx.arc(0,0,R,
                0,Math.PI*2);
        ctx.stroke();

        var stepSize = (this.max-this.min)/(this.steps+1);
        
        for(var i=0; i<=this.steps; i++) {
            var angle = ((i*stepSize)/(this.max-this.min)*360-90)/180*Math.PI;
            ctx.beginPath();
            ctx.moveTo(Math.cos(angle)*(R-R*0.1), Math.sin(angle)*(R-R*0.1));
            ctx.lineTo(Math.cos(angle)*R, Math.sin(angle)*R);
            ctx.stroke();
            ctx.fillStyle = this.fgColor;
            ctx.font = (this.width*0.03)+'px Arial';
            ctx.fillText(Math.ceil(i*stepSize), Math.cos(angle)*R*0.8-ctx.measureText(Math.ceil(i*stepSize)).width/2, Math.sin(angle)*R*0.8);
            ctx.font = (this.width*0.1)+'px Arial';
            switch(i) {
                case 0:  ctx.fillText('N', Math.cos(angle)*R*0.5-ctx.measureText('N').width/2, Math.sin(angle)*R*0.5); break;
                case 9:  ctx.fillText('E', Math.cos(angle)*R*0.5-ctx.measureText('E').width/2, Math.sin(angle)*R*0.5); break;
                case 18: ctx.fillText('S', Math.cos(angle)*R*0.5-ctx.measureText('S').width/2, Math.sin(angle)*R*0.5); break;
                case 27: ctx.fillText('W', Math.cos(angle)*R*0.5-ctx.measureText('W').width/2, Math.sin(angle)*R*0.5); break;
            }
        }
        ctx.rotate(this.position/180*Math.PI);
        ctx.translate(-this.cX, -this.cY);
    }
    
    /*
        Отрисовка стрелок прибора
    */    
    this.drawArrow = function()
    {
        /*
           Нарисовать стрелку
        */
        var ctx = engine.ctx;
        
        ctx.strokeStyle = this.arrowColor;
        ctx.beginPath();
        ctx.moveTo(this.width/2, 0);
        ctx.lineTo(this.width/2, this.height*0.1);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(this.width/2, this.height*0.9);
        ctx.lineTo(this.width/2, this.height);
        ctx.stroke();
    }
    
    /*
        Отрисовка прибора
    */
    this.draw = function()
    {
        var ctx = engine.ctx;
        
        var alpha = ctx.globalAlpha;
        
        this.drawBackground();
        this.drawScale();
        this.drawArrow();
        this.drawBorder();
                
                
        ctx.globalAlpha = alpha;
    }
}
