/**
 * @typedef {Object} BoxDecoration
 * @property {{blur: string; color: string; offsetX: string; offsetY: string}} shadow
 * @property {{lt: number; rt: number; lb: number; rb: number}} radius
 */
/**
 * @typedef {Object} TextDecoration
 * @property {string} style
 * @property {string} size
 * @property {string} fontFamily
 * @property {string} textAlign
 * @property {string} baseline
 * @property {string} direction
 */
/**
 * @typedef {Object} Area
 * @property {number} x
 * @property {number} y
 * @property {number} width
 * @property {number} height
 */
/**
 * @typedef {Object} RenderObj
 * @property {number} x
 * @property {number} y
 * @property {number} width
 * @property {number} height
 * @property {number} alpha
 * @property {string} type
 * @property {{color: string; width: number}} border
 * @property {string} color
 * @property {string} text
 * @property {HTMLImageElement} img
 * @property {BoxDecoration} boxDecoration
 * @property {TextDecoration} textDecoration
 */
export default {
    /**
     * @type {{canvas: HTMLCanvasElement; context: CanvasRenderingContext2D; WIDTH: number; HEIGHT: number;}}
     */
    options: {
        /*使用前对这四个变量进行配置
        || canvas: 一个canvas dom对象
        || context: canvas上下文
        || WIDTH: 为canvas设置的宽度
        || HEIGHT: 为canvas设置的高度
        */
        canvas: null,
        context: null,
        WIDTH: 0,
        HEIGHT: 0,
    },
    /**
     * @param {RenderObj} renderObj 
     */
    render(renderObj){
        let ctx = this.options.context;
        let data = {
            x: renderObj.x || 0,
            y: renderObj.y || 0,
            width: renderObj.width || 0,
            height: renderObj.height || 0,
            border: renderObj.border || null,//宽度，颜色
            color: renderObj.color || 'white',//背景色
            text: renderObj.text || 'Text',//文字
            img: renderObj.img || null,//Image对象
            textDecoration: renderObj.textDecoration || null,//大小，字体，对齐方式，基线，文本方向，溢出长度
            boxDecoration: renderObj.boxDecoration || null//圆角，阴影，渐变
        }
        switch (renderObj.type) {
            case 'rect':
                if(data.boxDecoration){
                    let dec = data.boxDecoration;
                    ctx.save();
                    ctx.globalAlpha = renderObj.alpha || 1;
                    if(dec.shadow){//设置阴影
                        dec.radius && (ctx.fillStyle = 'rgba(0,0,0,0.4)') || (ctx.fillStyle = data.color);
                        let s = dec.shadow;
                        ctx.shadowBlur = s.blur || 8;
                        ctx.shadowColor = s.color || 'rgba(0,0,0,0.32)';
                        ctx.shadowOffsetX = s.offsetX || 0;
                        ctx.shadowOffsetY = s.offsetY || 2;
                    }
                    if(true){//圆角
                        let r = dec.radius || {};
                        let x = data.x;
                        let y = data.y;
                        let width = data.width;
                        let height = data.height;
                        let lt = r.leftTop || r.lt || 0;
                        let rt = r.rightTop || r.rt || 0;
                        let lb = r.leftBottom || r.lb || 0;
                        let rb = r.rightBottom || r.rb || 0;
                        ctx.beginPath();
                        ctx.arc(x+lt,y+lt,lt,Math.PI,(3*Math.PI)/2);
                        ctx.arc(x+width-rt,y+rt,rt,(3*Math.PI)/2,2*Math.PI);
                        ctx.arc(x+width-rb,y+height-rb,rb,0,Math.PI/2);
                        ctx.arc(x+lb,y+height-lb,lb,Math.PI/2,Math.PI);
                        ctx.closePath();
                        ctx.fillStyle = data.color;
                        ctx.fill();
                        ctx.restore();
                    }
                } else {
                    ctx.save();
                    ctx.globalAlpha = renderObj.alpha || 1;
                    ctx.fillStyle = data.color;
                    ctx.fillRect(data.x,data.y,data.width,data.height);
                    ctx.restore();
                }
                ctx.save();
                ctx.globalAlpha = renderObj.alpha || 1;
                ctx.strokeStyle = data.border? data.border.color: 'blue';
                ctx.lineWidth = data.border?(data.border.width?data.border.width:1):1;
                data.border && ctx.strokeRect(data.x,data.y,data.width,data.height);
                ctx.restore();
                break;
            case 'img':
                ctx.save();
                ctx.globalAlpha = renderObj.alpha || 1;
                ctx.drawImage(data.img,data.x,data.y,data.width || data.img.naturalWidth,data.height || data.img.naturalHeight);
                ctx.restore();
                break;
            case 'line':
                ctx.save();
                ctx.globalAlpha = renderObj.alpha || 1;
                ctx.strokeStyle = data.color;
                ctx.moveTo(data.x,data.y);
                ctx.lineTo(data.x + data.width,data.y + data.height);
                ctx.stroke();
                ctx.restore();
                break;
            case 'text':
                let decoration = data.textDecoration || {};
                let style = decoration.style || 'normal';
                let size = decoration.size || '10px';
                let fm = decoration.fontFamily || 'sans-serif';
                let font = `${style} ${size} ${fm}`;
                ctx.save();
                ctx.globalAlpha = renderObj.alpha || 1;
                ctx.fillStyle = data.color;
                ctx.strokeStyle = data.border?(data.border.color?data.border.color:'blue'):'blue';
                ctx.font = font;
                ctx.textAlign = decoration.textAlign || 'start';
                ctx.textBaseline = decoration.baseline || 'alphabetic';
                ctx.direction = decoration.direction || 'inherit';
                ctx.fillText(data.text,data.x,data.y, decoration.maxWidth || data.width || this.options.WIDTH);
                ctx.restore();
                break;
            case 'blank':
                break;
            default:
                console.log('无效的type属性');
                break;
        }
    },
    /**
     * @param {RenderObj} renderObj 
     * @param {Area} area 
     */
    area(renderObj, area){
        ctx.save();
        let x = area.x || 0;
        let y = area.y || 0;
        let width = area.width || this.options.WIDTH;
        let height = area.height || this.options.HEIGHT;
        ctx.beginPath();
        ctx.moveTo(x,y);
        ctx.lineTo(x+width,y);
        ctx.lineTo(x+width,y+height);
        ctx.lineTo(x,y+height);
        ctx.lineTo(x,y);
        ctx.closePath();
        ctx.clip();
        this.render(renderObj);
        ctx.restore();
    },
    /**
     * @param {Area} area 
     */
    clear(area){
        if (!area) return (this.options.canvas.width = this.options.WIDTH);
        let x = area.x || 0;
        let y = area.y || 0;
        let width  = area.width || this.options.WIDTH;
        let height  = area.height || this.options.HEIGHT;
        ctx.clearRect(x,y,width,height);
    }
}