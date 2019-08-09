import React from 'react';
import styled from 'styled-components';

const Container = styled.div`
    position: relative;
    display: flex;
    justify-content: center;
`;

const SvgContainer = styled.div`
    padding: 10px 10px 30px 10px;
    margin: 0;
    position: relative;
`;

const SvgText = styled.text`
    fill: #444;
    font-weight: 300;
`;

type Data = {
    [timestamp: number]: {
        count: number;
    };
};

const monthList = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec'
];

interface GridData {
    month: number;
    day: number;
    week: number;
    count: number;
    date: number;
    year: number;
}

interface Props {
    data: Data;
    width?: number;
    till?: string | number;
    shownWeeks?: number;
}

function getLastDayTimestamp(date: Date | string | number) {
    const d = new Date(date);
    const dateStr = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()} 23:59:59`;
    return new Date(dateStr).getTime() + 1000;
}

function getGridData(data: Data, till: number, shownGrids: number): GridData[] {
    const firstDayTimestamp = till - shownGrids * 3600 * 1000 * 24;
    let grids = Array(shownGrids).fill(0);
    for (const key in data) {
        const index = Math.floor((parseInt(key, 10) - firstDayTimestamp) / 3600 / 24 / 1000);
        grids[index] += data[key].count;
    }

    grids = grids.map((v, index) => {
        const date = new Date(firstDayTimestamp + index * 3600 * 1000 * 24);
        return {
            year: date.getFullYear(),
            month: date.getMonth() + 1,
            date: date.getDate(),
            week: Math.floor(index / 7),
            day: date.getDay(),
            count: v
        };
    });
    return grids;
}

export const GridCalendar: React.FC<Props> = (props: Props) => {
    const [chosenIndex, setChosenIndex] = React.useState<undefined | number>(undefined);
    const { till = new Date(), width = 800, data, shownWeeks = 53 } = props;
    const tillTimestamp = getLastDayTimestamp(till);
    const day = (new Date(till).getDay() + 1) % 7;
    const shownGrids = (day === 0 ? 7 : day) + (shownWeeks - 1) * 7;
    const grids = getGridData(data, tillTimestamp, shownGrids);
    const maxCountInADay = Math.max(5, Math.max(...grids.map(v => v.count)));
    const axisMargin = 36;
    const innerWidth = width - axisMargin;

    const gridMargin = Math.floor((innerWidth / shownWeeks) * 0.1 + 2);
    const gridWidth = Math.floor(innerWidth / shownWeeks) - gridMargin;
    const gridHeight = gridWidth;
    const height = (gridWidth + gridMargin) * 7 + gridMargin;
    let toolTipTop = chosenIndex
        ? (gridMargin + gridWidth) * (grids[chosenIndex].day + 1.8) + axisMargin
        : 0;
    if (toolTipTop + 20 > height + axisMargin) {
        toolTipTop -= 70;
    }

    const Tooltip = chosenIndex ? (
        <div
            style={{
                backgroundColor: 'rgba(0, 0, 0, 0.9)',
                color: 'white',
                position: 'absolute',
                left: (gridMargin + gridWidth) * grids[chosenIndex].week + axisMargin,
                top: toolTipTop,
                padding: '16px 8px',
                borderRadius: 8,
                zIndex: 10,
                overflow: 'hidden',
                textOverflow: 'clip'
            }}
        >
            <span style={{ fontWeight: 700 }}>
                <b>{`${grids[chosenIndex].count} pomodoros `}</b>
            </span>
            <span style={{ fontWeight: 300, fontSize: '0.7em', marginLeft: 8 }}>
                {`${grids[chosenIndex].year}-${grids[chosenIndex].month}-${grids[chosenIndex].date}`}
            </span>
        </div>
    ) : (
        undefined
    );

    const rects = grids.map((v, index) => {
        const onEnter = () => setChosenIndex(index);
        return (
            <rect
                width={gridWidth}
                height={gridHeight}
                x={v.week * (gridWidth + gridMargin)}
                y={v.day * (gridWidth + gridMargin)}
                fill={`hsl(50, ${v.count === 0 ? '0%' : '60%'}, ${92 -
                    (v.count / maxCountInADay) * 70}%`}
                key={index}
                onMouseOver={onEnter}
            />
        );
    });
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thur', 'Fri', 'Sat'].map((v, index) => {
        return (
            <SvgText
                x={axisMargin - gridMargin}
                y={index * (gridWidth + gridMargin)}
                key={index}
                alignmentBaseline="hanging"
                textAnchor="end"
                style={{ fontSize: gridWidth }}
            >
                {v}
            </SvgText>
        );
    });

    function getMonthText() {
        const weekMonthMap: number[] = [];
        grids.forEach(v => {
            weekMonthMap[v.week] = v.month;
        });
        const firstMonthWeekPair: [number, number][] = [];
        for (let i = 0; i < weekMonthMap.length - 1; i += 1) {
            const week = i;
            const month = weekMonthMap[week];
            if (firstMonthWeekPair.findIndex(v => v[0] === month) === -1) {
                firstMonthWeekPair.push([month, week + 1]);
            }
        }

        return firstMonthWeekPair.map(v => (
            <SvgText
                x={v[1] * (gridWidth + gridMargin)}
                y={axisMargin - gridMargin * 2}
                key={v[1]}
                textAnchor="start"
                style={{ fontSize: gridWidth }}
            >
                {monthList[v[0] - 1]}
            </SvgText>
        ));
    }

    const onMouseLeave = () => setChosenIndex(undefined);
    return (
        <Container>
            <SvgContainer onMouseLeave={onMouseLeave}>
                <svg width={width + axisMargin} height={height + axisMargin}>
                    <g transform={`translate(${axisMargin}, 0)`}>{getMonthText()}</g>
                    <g transform={`translate(0, ${axisMargin})`}>{weekdays}</g>
                    <g transform={`translate(${axisMargin}, ${axisMargin})`}>{rects}</g>
                </svg>
                {Tooltip}
            </SvgContainer>
        </Container>
    );
};