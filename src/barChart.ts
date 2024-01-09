import d3 from "d3";
import {NumberFormatterEN, NumberFormatterTR} from "./common";

export type BarChartData = {
    [bucket:string]:number;
};

const CHART_REFERENCE_WIDTH = 1280;
const CHART_REFERENCE_HEIGHT = Math.floor(CHART_REFERENCE_WIDTH * 9 / 21)
const X_AXIS_ANNOTATION_REFERENCE_HEIGHT = 50;
const Y_AXIS_ANNOTATION_REFERENCE_WIDTH = 75;

const Y_AXIS_MAX_FACTOR = 1.1;
const X_AXIS_PADDING = 0.2;

export class BarChart {
    private readonly chartContainerName:string;
    private chartTooltipName:string;
    private readonly data:BarChartData;


    constructor(chartContainerName:string, chartTooltipName:string, data:BarChartData) {
        this.chartContainerName = chartContainerName;
        this.chartTooltipName = chartTooltipName;
        this.data = data;
    }

    draw() {
        // set the dimensions and margins of the graph
        const xAxisWidth = CHART_REFERENCE_WIDTH - 2 * Y_AXIS_ANNOTATION_REFERENCE_WIDTH;
        const yAxisHeight = CHART_REFERENCE_HEIGHT - 2 * X_AXIS_ANNOTATION_REFERENCE_HEIGHT;

        // append the svg object to the body of the page
        const svg = d3.select(this.chartContainerName)
            .append("svg")
            .attr("viewBox", `0 0 ${CHART_REFERENCE_WIDTH} ${CHART_REFERENCE_HEIGHT}`)
            .append("g")
            .attr("transform", `translate(${Y_AXIS_ANNOTATION_REFERENCE_WIDTH},${X_AXIS_ANNOTATION_REFERENCE_HEIGHT})`);

        // convert data from a map to an array
        const arrayData = Object.entries(this.data)
            .map(([bucket, value]) => {
                return {
                    bucket: String(bucket),
                    value: value,
                };
            });

        // X axis scale
        const xScale = d3.scaleBand()
            .range([0, xAxisWidth])
            .domain(arrayData.map(d => d.bucket))
            .padding(X_AXIS_PADDING);

        // X axis labels
        svg.append("g")
            .attr("transform", `translate(0, ${yAxisHeight})`)
            .call(d3.axisBottom(xScale))
            .selectAll("text")
            .attr("transform", "translate(-10,0)rotate(-45)")
            .style("text-anchor", "end");

        // find max Y value
        const maxY = Math.max(...arrayData.map(d => d.value));

        // Y axis scale
        const yScale = d3.scaleLinear()
            .domain([0, maxY * Y_AXIS_MAX_FACTOR])
            .range([yAxisHeight, 0]);


        svg.append("g")
            .call(d3
                .axisLeft(yScale)
                .tickFormat(function (d) {
                    // TODO: numbers on the left side of the axis is not localized
                    // at least, let's not add any grouping separators
                    return String(d);
                })
            );

        const tooltip = d3
            .select(this.chartTooltipName)
            .attr("class", "bar-chart-tooltip");

        // Bars
        svg.selectAll("mybar")
            .data(arrayData)
            .join("rect")
            .attr("x", d => xScale(d.bucket))
            .attr("y", d => yScale(d.value))
            .attr("width", xScale.bandwidth())
            .attr("height", d => yAxisHeight - yScale(d.value))
            .attr("class", "bar-chart-bar")
            .on("mouseover", (event, d) => {
                tooltip
                    .style("opacity", 1);

                tooltip.select("span[lang='en']").html(NumberFormatterEN.format(d.value));
                tooltip.select("span[lang='TR']").html(NumberFormatterTR.format(d.value));
            })
            .on("mousemove", (event) => {
                tooltip
                    .style("left", (event.offsetX) - 10 + "px")
                    .style("top", (event.offsetY) - 50 + "px")
            })
            .on("mouseleave", () => {
                tooltip.style("opacity", 0);
            });
    }
}

