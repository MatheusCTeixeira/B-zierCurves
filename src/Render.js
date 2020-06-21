import React, {Component} from "react";

class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;

        this.times = this.times.bind(this);
        this.sum = this.sum.bind(this);
        this.sub = this.sub.bind(this);
        this.str = this.str.bind(this);
    }

    x() {
        return this.x;
    }

    y() {
        return this.y;
    }

    times(value) {
        let x = this.x * value;
        let y = this.y * value;

        return new Point(x, y);
    }

    sum(anotherPoint) {
        let x = this.x + anotherPoint.x;
        let y = this.y + anotherPoint.y;

        return new Point(x, y);
    }

    sub(anotherPoint) {
        let x = this.x - anotherPoint.x;
        let y = this.y - anotherPoint.y;

        return new Point(x, y);
    }

    str() {
        return `${this.x} ${this.y}`;
    }
}

export default class Render extends Component {
    static counter = 0;
    static lastPathDrawn = null;
    static w3SVG = "http://www.w3.org/2000/svg";

    constructor(props) {
        super(props);
        this.state = {width: props.width, height: props.height, method: "linear"};

        this.factoryElement      = this.factoryElement.bind(this);
        this.addPoint            = this.addPoint.bind(this);
        this.factoryCircle       = this.factoryCircle.bind(this);
        this.drawPath            = this.drawPath.bind(this);
        this.drawGuideLines      = this.drawGuideLines.bind(this);
        this.drawLinearBezier    = this.drawLinearBezier.bind(this);
        this.drawQuadraticBezier = this.drawQuadraticBezier.bind(this);
        this.drawCubicBezier     = this.drawCubicBezier.bind(this);
        this.selectMethod        = this.selectMethod.bind(this);
        this.draw                = this.draw.bind(this);
        this.checkNumberOfPoints = this.checkNumberOfPoints.bind(this);
        this.reset               = this.reset.bind(this);
        this.removeLastPathDrawn = this.removeLastPathDrawn.bind(this);

        this.points = {};
        this.numPointByMethod = {"linear": 2, "quadratic": 3, "cubic": 4};
    }

    componentDidMount() {
        this.svg = document.getElementById("__draw_screen__");
    }

    factoryElement(elementType) {
        return document.createElementNS(Render.w3SVG, elementType);
    }

    factoryCircle(properties) {
        let circle = this.factoryElement("circle");
        let uuid = Render.counter++;

        for (let property in properties) {
            const value = properties[property];
            circle.setAttributeNS(null, property, value);
        }
        circle["data-id"] = uuid;

        return circle;
    }

    getMousePosition(mouseEvent) {
        const rect = this.svg.getClientRects()[0];
        let x = mouseEvent.clientX - rect.x;
        let y = mouseEvent.clientY - rect.y;

        return {x: x, y: y};
    }

    addPoint(mouseEvent) {
        const maxPoints = this.numPointByMethod[this.state.method];
        if (Object.values(this.points).length >= maxPoints) return;

        let {x, y} = this.getMousePosition(mouseEvent);

        let circle = this.factoryCircle({cx: x, cy: y, r: 7, fill: "black"});

        circle.addEventListener("click", ()=>{
            circle.parentElement.removeChild(circle);
            delete this.points[circle["data-id"]];
        });

        circle.addEventListener("mouseover", ()=>  {
            circle.setAttributeNS(null, "fill", "red");
        });

        circle.addEventListener("mouseout", ()=>  {
            circle.setAttributeNS(null, "fill", "black");
        });

        this.points[circle["data-id"]] = new Point(x, y);

        this.svg.appendChild(circle);
    }

    drawPath(points) {
        let path = this.factoryElement("path");

        let steps = `M ${points[0].str()} `;

        for (let point of points.slice(1)) {
            steps = steps.concat(`L ${point.str()} `);
        }

        path.setAttributeNS(null, "d", steps);
        path.setAttributeNS(null, "stroke", "black");
        path.setAttributeNS(null, "stroke-width", "2");
        path.setAttributeNS(null, "fill", "none");

        Render.lastPathDrawn = path;

        this.svg.appendChild(path);
    }

    drawGuideLines(lines) {
        const [p0, p1, p2] = lines;

        if (Render.lastGuideLine == null)
            Render.lastGuideLine = [];

        if (p0 != null && p1 != null) {
            let line_1 = this.factoryElement("line");
            line_1.setAttributeNS(null, "x1", p0.x);
            line_1.setAttributeNS(null, "y1", p0.y);
            line_1.setAttributeNS(null, "x2", p1.x);
            line_1.setAttributeNS(null, "y2", p1.y);
            line_1.setAttributeNS(null, "stroke", "black");

            Render.lastGuideLine.push(line_1);
            this.svg.appendChild(line_1);
        }

        if (p1 != null && p2 != null) {
            let line_2 = this.factoryElement("line");
            line_2.setAttributeNS(null, "x1", p1.x);
            line_2.setAttributeNS(null, "y1", p1.y);
            line_2.setAttributeNS(null, "x2", p2.x);
            line_2.setAttributeNS(null, "y2", p2.y);
            line_2.setAttributeNS(null, "stroke", "black");

            Render.lastGuideLine.push(line_2);
            this.svg.appendChild(line_2);
        }
    }

    drawLinearBezier() {
        let [p0, p1] = Object.values(this.points);

        let points = [];
       for (let t = 0; t < 1; t += 0.05) {
            let point = p0.times(1-t).sum(p1.times(t));
            points.push(point);
        }

        this.drawPath(points);
    }

    drawQuadraticBezier() {
        let [p0, p1, p2] = Object.values(this.points);

        let points = [];
        let guide_line;

        for (let t = 0; t < 1; t += 0.1) {
            let p0_p1 = p0.sub(p1);
            let p2_p1 = p2.sub(p1);
            let point = p1
                .sum(p0_p1.times((1-t)*(1-t)))
                .sum(p2_p1.times(t*t));

            guide_line = [p0.sum(p1.sub(p0).times(t)), p1.sum(p2.sub(p1).times(t))];
            this.drawGuideLines(guide_line);
            points.push(point);
        }

        this.drawPath(points);
    }

    drawCubicBezier() {
        let [p0, p1, p2, p3] = Object.values(this.points);

        const pow = (x, n) => Math.pow(x, n);
        let points = [];
        let guide_lines;

        for (let t = 0; t < 1; t += 0.1) {
            let point = p0.times(pow(1-t, 3))
                .sum(p1.times(3*pow(1-t, 2)*t))
                .sum(p2.times(3*(1-t)*pow(t, 2)))
                .sum(p3.times(pow(t, 3)));

            guide_lines = [
                p0.sum(p1.sub(p0).times(t)),
                p1.sum(p2.sub(p1).times(t)),
                p2.sum(p3.sub(p2).times(t))];

            this.drawGuideLines(guide_lines);
            points.push(point);
        }

        this.drawPath(points);
    }

    checkNumberOfPoints(selectedMethod) {
        const numberOfPoints = Object.values(this.points).length;
        const minimumOfPoints = this.numPointByMethod[selectedMethod];

        return (numberOfPoints < minimumOfPoints);
    }

    removeLastPathDrawn() {
        if (Render.lastPathDrawn)
            this.svg.removeChild(Render.lastPathDrawn);

        if (Render.lastGuideLine != null) {
            for (const line of Render.lastGuideLine)
                this.svg.removeChild(line);

            Render.lastGuideLine = null;
        }
    }

    draw() {
        this.removeLastPathDrawn();

        const selectedMethod = this.state.method;

        if (this.checkNumberOfPoints(selectedMethod)) {
            alert("You should add more points.");
            return 0;
        }

        switch (selectedMethod) {
        case "linear":
            this.drawLinearBezier();
            break;
        case "quadratic":
            this.drawQuadraticBezier();
            break;
        case "cubic":
            this.drawCubicBezier();
            break;
        default:
            throw Error("Invalid number of points.");
        }
    }

    reset() {
        while (this.svg.firstChild)
            this.svg.removeChild(this.svg.firstChild);

        Render.lastPathDrawn = null;
    }

    selectMethod(event) {
        this.setState({method: event.target.value});

        this.points = [];
        this.reset();
    }

    render(){
        return (<div>
        <div id="box">
            <svg
                width={this.state.width}
                height={this.state.height}
                id="__draw_screen__"
                onClick={this.addPoint}
                >

            </svg>
        </div>
            <div id="control">
                <label>Linear
                    <input
                        type="radio"
                        name="bezierKind"
                        value="linear"
                        onChange={this.selectMethod}
                        defaultChecked/>
                </label>
                <label>Quadratic
                    <input
                        type="radio"
                        name="bezierKind"
                        value="quadratic"
                        onChange={this.selectMethod}/>
                </label>
                <label>Cubic
                    <input
                        type="radio"
                        name="bezierKind"
                        value="cubic"
                        onChange={this.selectMethod}/>
                </label>
            </div>
            <div id="draw">
                <button onClick={this.draw}>Draw Bezier</button>
            </div>

        </div>);
    }
}
