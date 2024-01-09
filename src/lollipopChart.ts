import d3 from "d3";

export type LollipopChartData = {
    [bucket:string]:number;
};

const CHART_REFERENCE_WIDTH = 780;
const CHART_REFERENCE_HEIGHT = Math.floor(CHART_REFERENCE_WIDTH * 3 / 4)
const X_AXIS_ANNOTATION_REFERENCE_HEIGHT = 50;
const Y_AXIS_ANNOTATION_REFERENCE_WIDTH = 230;

const X_AXIS_SCALE_EXPONENT = 0.5;
const X_AXIS_MAX_FACTOR = 1.1;
const Y_AXIS_PADDING = 1;
const CIRCLE_SIZE = CHART_REFERENCE_WIDTH / 150;

export class LollipopChart {
    private readonly chartContainerName:string;
    private readonly data:LollipopChartData;

    constructor(chartContainerName:string, data:LollipopChartData) {
        this.chartContainerName = chartContainerName;
        this.data = data;
    }

    draw() {
        // convert data from a map to an array
        const arrayData = Object.entries(this.data)
            .map(([bucket, value]) => {
                return {
                    bucket: String(bucket),
                    value: value,
                };
            }).sort((a, b) => {
                if (a.value == b.value) {
                    return a.bucket.localeCompare(b.bucket);
                }
                return b.value - a.value;
            });

        // set the dimensions and margins of the graph
        const xAxisWidth = CHART_REFERENCE_WIDTH - 1.2 * Y_AXIS_ANNOTATION_REFERENCE_WIDTH;
        const yAxisHeight = CHART_REFERENCE_HEIGHT - 2 * X_AXIS_ANNOTATION_REFERENCE_HEIGHT;

        // append the svg object to the body of the page
        const svg = d3.select(this.chartContainerName)
            .append("svg")
            .attr("class", "lollipop-chart")
            .attr("viewBox", `0 0 ${CHART_REFERENCE_WIDTH} ${CHART_REFERENCE_HEIGHT}`)
            .append("g")
            .attr("transform", `translate(${Y_AXIS_ANNOTATION_REFERENCE_WIDTH},${X_AXIS_ANNOTATION_REFERENCE_HEIGHT})`);

        // find max value
        const maxValue = Math.max(...arrayData.map(d => d.value));

        // Add X axis
        const xScale = d3.scalePow()
            .domain([0, maxValue * X_AXIS_MAX_FACTOR])
            .range([0, xAxisWidth])
            .exponent(X_AXIS_SCALE_EXPONENT);

        svg.append("g")
            .attr("transform", `translate(0, ${yAxisHeight})`)
            .call(d3
                .axisBottom(xScale)
                .tickFormat(function (d) {
                    // TODO: numbers on the bottom side of the axis is not localized
                    // at least, let's not add any grouping separators
                    return String(d);
                }))
            .selectAll("text")
            .attr("transform", "translate(-10,0)rotate(-45)")
            .style("text-anchor", "end");

        // Y axis
        const yScale = d3.scaleBand()
            .range([0, yAxisHeight])
            .domain(arrayData.map(d => d.bucket))
            .padding(Y_AXIS_PADDING);

        svg.append("g")
            .call(d3.axisLeft(yScale));

        // Lines
        svg.selectAll("myline")
            .data(arrayData)
            .join("line")
            .attr("x1", d => xScale(d.value))
            .attr("x2", xScale(0))
            .attr("y1", d => yScale(d.bucket))
            .attr("y2", d => yScale(d.bucket))
            .attr("class", "lollipop-chart-line");

        // Circles
        svg.selectAll("mycircle")
            .data(arrayData)
            .join("circle")
            .attr("cx", d => xScale(d.value))
            .attr("cy", d => yScale(d.bucket))
            .attr("r", CIRCLE_SIZE)
            .attr("class", "lollipop-chart-circle");

        // Text
        svg.selectAll("mytext")
            .data(arrayData)
            .join("text")
            .attr("x", d => xScale(d.value) + CIRCLE_SIZE * 2)
            .attr("y", d => yScale(d.bucket) + CIRCLE_SIZE / 2)    // +20 to adjust position (lower)
            .text(d => String(d.value))
            .attr("class", "lollipop-chart-text");
    }
}
