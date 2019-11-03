import React, {Component} from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import Container from 'react-bootstrap/Container';
import Form from 'react-bootstrap/Form';
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';
import Toast from 'react-bootstrap/Toast';
import Navbar from 'react-bootstrap/Navbar';
import moment from 'moment';
import {Line} from 'react-chartjs-2';

import './App.css';

const suggest = require('suggestion');


class App extends Component {
    constructor(props) {
        super(props);
        this.state = {
            keyword: "",
            loading: false,
            keywords: [],
            abcKeywords: [],
            msg: '',
            msgs: [],
            config: {
                type: 'line',
                maintainAspectRatio: false,
                datasets: []
            },
        };
        this.handleKeyword = this.handleKeyword.bind(this);
        this.searchButton = this.searchButton.bind(this);
        this.closeToast = this.closeToast.bind(this);
        this.setToast = this.setToast.bind(this);
        this.getTrend = this.getTrend.bind(this);
        this.getTrends = this.getTrends.bind(this);
    }

    closeToast(index) {
        let msgs = this.state.msgs;
        delete (msgs[index]);
        console.log(msgs);
        console.log(index);
        this.setState({msgs});
    }

    setToast(title, message) {
        let msgs = this.state.msgs;
        let msg = {
            name: 'Set Title',
            time: new moment(),
            body: message
        };
        msg.name = title;
        msgs.push(msg);
        this.setState({msgs});
    }

    handleKeyword(e) {
        if (this.state.loading) {
            this.setState({keyword: e.target.value});
            return
        }
        this.setState({keyword: e.target.value});
        const keyword = e.target.value;
        const getKeywords = (thisKeyword) => {
            return new Promise((resolve, reject) => {
                suggest(thisKeyword, function (err, suggestions) {
                    if (err) reject(err);
                    console.log(suggestions);
                    resolve(suggestions)
                });
            });
        };

        getKeywords(keyword).then(keywords => {
            this.setState({keywords: keywords, loading: false})
        }).catch((error) => {
            this.setToast("Error", error)
        }).finally(() => {
            this.setState({
                loading: false, config: {
                    type: 'line',
                    maintainAspectRatio: false,
                    datasets: []
                }
            });
        });
    }

    getTrend(e) {
        const keyword = e.currentTarget.dataset.id ;
        console.log(keyword);
        const getTrends = (thisKeyword) => {
            return new Promise((resolve, reject) => {
                fetch('/keyword/trends',
                    {
                        method: 'POST', // or 'PUT'
                        body: JSON.stringify({keyword: thisKeyword}), // data can be `string` or {object}!
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    }).then(response => response.json())
                    .then((data) => {
                        if (typeof data.err !== "undefined") {
                            reject(data)
                        }
                        resolve(data);
                    })
                    .catch((error) => {
                        reject(error)
                    })
            });
        };
        getTrends(keyword).then(trends => {
            console.log(trends);
            console.log(keyword);
            let dataset = {
                label: keyword,
                fill: true,
                lineTension: 0,
                pointRadius: 3,
                borderColor: getRandomColor(),
                borderWidth: 1.5,
                data: [],
            };
            if (typeof trends.default.timelineData.length === "undefined") {
                return
            }
            for (let i = 0, len = trends.default.timelineData.length; i < len; i++) {
                dataset.data.push({
                    x: moment(trends.default.timelineData[i].formattedAxisTime, "MMM D hh:mm p"), // "Nov 2 at 10:48 PM"
                    y: parseFloat(trends.default.timelineData[i].value[0])
                });
            }
            let config = this.state.config;
            config.datasets[config.datasets.length] = dataset;
            this.setState({config})
        }).catch((error) => {
            console.log(error);
            if (typeof error.err === "undefined") {
                let noResults = this.state.keywords.indexOf(keyword);
                let keywords = this.state.keywords;
                this.state.keywords[noResults] = this.state.keywords[noResults] + " no results";
                this.setState(keywords)
            } else {
                console.log("Error rate limited");
            }
        });
        console.log(this.state);
    }
    getTrends() {
       const keywords =this.state.abcKeywords;
        const getTrends = (thisKeyword) => {
            return new Promise((resolve, reject) => {
                fetch('/keyword/trends',
                    {
                        method: 'POST', // or 'PUT'
                        body: JSON.stringify({keyword: thisKeyword}), // data can be `string` or {object}!
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    }).then(response => response.json())
                    .then((data) => {
                        if (typeof data.err !== "undefined") {
                            reject(data)
                        }
                        resolve(data);
                    })
                    .catch((error) => {
                        reject(error)
                    })
            });
        };
        keywords.map((_, index) => {
            getTrends(keywords[index]).then(trends => {
                let keyword = keywords[index];
                console.log(keyword);
                let dataset = {
                    label: keyword,
                    fill: true,
                    lineTension: 0,
                    pointRadius: 3,
                    borderColor: getRandomColor(),
                    borderWidth: 1.5,
                    data: [],
                };
                if (typeof trends.default.timelineData.length === "undefined") {
                    return
                }
                for (let i = 0, len = trends.default.timelineData.length; i < len; i++) {
                    dataset.data.push({
                        x: moment(trends.default.timelineData[i].formattedAxisTime, "MMM D hh:mm p"), // "Nov 2 at 10:48 PM"
                        y: parseFloat(trends.default.timelineData[i].value[0])
                    });
                }
                let config = this.state.config;
                config.datasets[config.datasets.length] = dataset;
                this.setState({config})
            }).catch((error) => {
                if (typeof error.err === "undefined") {
                    let noResults = this.state.keywords.indexOf(keywords[index]);
                    let abcKeywords = this.state.abcKeywords;
                    this.state.abcKeywords[noResults] = this.state.abcKeywords[noResults] + " no results";
                    this.setState(abcKeywords)
                } else {
                    console.log("Rate limited");
                }
            });
        });
    }


    searchButton() {
        this.setState({loading: true});
        const keyword = this.state.keyword;
        const getKeywords = (thisKeyword) => {
            return new Promise((resolve, reject) => {
                suggest(thisKeyword, {levels: 1}, function (err, suggestions) {
                    if (err) reject(err);
                    console.log(suggestions);
                    resolve(suggestions)
                });
            });
        };
        getKeywords(keyword).then(keywords => {
            this.setState({abcKeywords: keywords, loading: false})
        }).catch((error) => {
            this.setState({loading: false});
            this.setToast("Error", error)
        }).finally(() => {
            this.setState({
                loading: false, config: {
                    type: 'line',
                    maintainAspectRatio: false,
                    datasets: []
                }
            }, () => this.getTrends());
        });

    }

    render() {
        const keywords = this.state.keywords;
        const abcKeywords = this.state.abcKeywords;
        const messages = this.state.msgs;
        const keywordList = keywords.map((_, index) => {
            return (<li onClick={this.getTrend} data-id={keywords[index]} key={index}>{keywords[index]}</li>)
        });
        const abcKeywordList = abcKeywords.map((_, index) => {
            return (<li onClick={this.getTrend} data-id={abcKeywords[index]} key={index}>{abcKeywords[index]}</li>)
        });
        const msgList = messages.map((_, index) => {
            return (
                <Toast key={index + new Date()} show={true} onClose={() => this.closeToast(index)} autohide>
                    <Toast.Header>
                        <img style={{width: 20, height: 20}} src="favicon.png" className="rounded mr-2" alt=""/>
                        <strong className="mr-auto">{messages[index].name}</strong>
                        <small>{messages[index].time.fromNow()}</small>
                    </Toast.Header>
                    <Toast.Body>{messages[index].body}</Toast.Body>
                </Toast>
            )
        });
        return (
            <Container fluid>

                <Navbar bg="dark" variant="dark">
                    <Navbar.Brand href="#home">
                        <img
                            alt=""
                            src="/favicon.png"
                            width="30"
                            height="30"
                            className="d-inline-block align-top"
                        />
                        {' Keyword Search'}
                    </Navbar.Brand>
                </Navbar>
                <div style={{
                    position: 'fixed',
                    top: 1,
                    right: 1,
                    zIndex: 100,
                }}>
                    {msgList}
                </div>
                Begin typing keyword. The results will automatically be fetched.
                <p/>
                <Form>
                    <Form.Group as={Col} md="4" controlId="keyword">
                        <Form.Label>Keyword Search</Form.Label>
                        <Form.Control name="keyword" value={this.state.keyword}
                                      onChange={this.handleKeyword}
                                      placeholder="Emerald QLD"/>
                    </Form.Group>
                    <Button variant="primary" disabled={this.state.loading}
                            onClick={!this.state.loading ? this.searchButton : null}>
                        {this.state.loading ? <Spinner
                            as="span"
                            animation="grow"
                            size="sm"
                            role="status"
                            aria-hidden="true"
                        /> : 'Alphabetic Search'}
                    </Button>
                </Form>
                <div>
                    <Line
                        data={this.state.config}
                        height={400}
                        options={{
                            maintainAspectRatio: false,
                            title: {
                                display: true,
                                text: `Trends`
                            },
                            scales: {
                                xAxes: [{
                                    type: 'time',
                                    display: true,
                                    scaleLabel: {
                                        display: true,
                                        labelString: "time",
                                    },
                                    ticks: {
                                        major: {
                                            fontStyle: 'bold',
                                            fontColor: '#FF0000'
                                        }
                                    }
                                }],
                                yAxes: [{
                                    display: true,
                                    scaleLabel: {
                                        display: true,
                                        labelString: "Percentage"
                                    }
                                }]
                            }
                        }}
                    />
                </div>
                <br/>
                {this.state.keywords.length > 0 && <div><h3>Keyword Suggestions</h3>
                    <ul>{keywordList}</ul>
                </div>}
                {this.state.abcKeywords.length > 0 && <div><h3>ABC Keyword Search</h3>
                    <ul>{abcKeywordList}</ul>
                </div>}
            </Container>
        )
    }
}

function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

export default App;
