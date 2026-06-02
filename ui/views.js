import { Assessment } from "../models/models.js";
import { AccessEvent, GridIcon, GridLayout, SvgPlus } from "./squidly-utils.js";


const homeSymbol = {svg: `<svg class = "noci icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M3 10.5 12 3l9 7.5"></path><path d="M5 10v10h5v-6h4v6h5V10"></path></svg>`}
const leftSymbol = {svg: `<svg class = "noci icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M15 18 9 12l6-6"></path></svg>`}
const rightSymbol = {svg: `<svg class = "noci icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M9 18l6-6-6-6"></path></svg>`}
const resultsSymbol = {svg: `<svg class = "noci icon" viewBox="-3 -3 30 30" aria-hidden="true" focusable="false"><path d="M17.198,12.038c0,2.871-2.327,5.198-5.198,5.198s-5.198-2.327-5.198-5.198,2.327-5.198,5.198-5.198"/><path d="M22.024,11.772c0,5.536-4.488,10.024-10.024,10.024S1.976,17.308,1.976,11.772,6.464,1.748,12,1.748"/><polyline points="22.024 1.748 12 12.237 12.555 10.223 14.065 11.901 12 12.237" /></svg>`}
const speakSymbol = {svg: `<svg class = "noci icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M8.121.933c.183.456.36.914.518,1.377.219.641-.113,1.114-.422,1.624-.523.865-.571,1.699-.023,2.602.429.707,1.025,1.289,1.63,1.879.641.625,1.362,1.2,1.8,1.946.485.826.148,1.196-.667,1.458-.262.085-.538.149-.805.205-1.011.212-1.172.828-.922,1.465.444,1.133.359,1.254-1.075,1.58-.58.132-1.292.129-1.607.69,0,0,.453.635,1.002.701.436.053.861.127,1.271.268.646.221.826.556.391.914-1.067.877-1.138,1.944-.826,3.024.136.47-.069.648-.434.872-.557.341-1.225.389-1.873.419-.932.044-1.87.015-2.805.007-.154-.001-.296-.022-.472-.039-.661-.065-1.174-.025-1.674.36"/><path d="M14.043,18.488c.69-.895,1.118-2.003,1.118-3.221s-.427-2.326-1.118-3.221"/><path d="M16.901,20.967c1.158-1.579,1.854-3.552,1.855-5.7s-.695-4.121-1.852-5.701"/><path d="M19.77,22.898c1.63-2.114,2.61-4.755,2.61-7.631s-.98-5.517-2.61-7.631"/></svg>`}
const saveSymbol = {svg: `<svg class = "noci icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><polygon points="19.671 19.633 4.329 19.633 4.329 4.291 16.17 4.291 19.671 7.792 19.671 19.633" stroke-linecap="round"/><path d="M7.135,4.291h7.376v2.909c0,.91-.739,1.649-1.649,1.649h-4.079c-.91,0-1.649-.739-1.649-1.649v-2.909h0Z"/><path d="M7.703,12.419h8.379v5.003c0,1.22-.991,2.211-2.211,2.211h-3.957c-1.22,0-2.211-.991-2.211-2.211v-5.003h0Z" transform="translate(23.786 32.052) rotate(-180)"/><line x1="12" y1="4.291" x2="12" y2="6.397"/></svg>`}
class NociButton extends GridIcon {
    constructor(info, g) {
        info.type = {theme: info.theme || "noci", card: false}
        super(info, g)

        this.displayValueElement?.adjustFS();
    }

    onresize(...args) {
        super.onresize(...args);
        this.displayValueElement?.adjustFS();
    }

    set selected(bool) {
        this.toggleAttribute("selected", bool)
    }
}

class QuestionOptions extends SvgPlus {
    #selectedValue = null;
    constructor(question, answerImages) {
        super("div");
        this.classList.add("question-options");
    
        const options = {}
        if (question?.scale) {
            const values = question.scale.values;

            for (let v of values) {
                // Create label if it exists for this value
                let label = null;
                if (question.scale.labels?.[v]) {
                    label = new SvgPlus("div")
                    label.props = {
                        class: "scale-description",
                        content: question.scale.labels[v],
                    }
                    
                }
                console.log(question)

                // Create main button for this value
                let button = new NociButton({
                    displayValue: String(v), 
                    symbol: answerImages && v in answerImages ? answerImages[v].src : null,
                    theme: "noci-answer",
                    events: {
                        "access-click": (e) => {
                            this.selected = v;
                            let e2 = new AccessEvent("answer-selected", e);
                            this.dispatchEvent(e2);
                        }
                    }
                });
                options[v] = {
                    button,
                    label,
                };
            }
        }
        const values = Object.values(options)
        let g1 = this.createChild(GridLayout, {class: "labels"}, 1, values.length)
        let g2 = this.createChild(GridLayout, {class: "buttons"}, 1, values.length)
        values.forEach(({button, label}, i) => {
            label && g1.add(label, 0, i)
            g2.add(button, 0, i)
        });
        this.options = options;
    }

    set selected(value) {
        for (let k in this.options) {
            this.options[k].button.selected = k==value;
        }
        this.#selectedValue = value;
    }
    get selected() {
        return this.#selectedValue;
    }
}

class QuestionView extends GridLayout {
    /**
     * @param {{ 
     *          assessment: Assessment, 
     *          onAnswer: function(value), 
     *          onGoHome: function(), 
     *          onMoveQuestion: function(step), 
     *          onShowResult: function()}} data
     */
    constructor({assessment, onAnswer, onGoHome, onMoveQuestion, onShowResult}) {
        super(4, 5)
        
        const questionUtterance = assessment?.currentQuestion()?.utterance;
        SquidlyAPI.loadUtterances([questionUtterance]);
        
        const currentStep = assessment?.questionIndex + 1;
        const totalSteps = assessment?.questions?.length;
        const progressPercent = Math.round((currentStep / totalSteps) * 100);

        this.addItemInstances(NociButton, [
            [
                null,
                {symbol: speakSymbol, displayValue: "speak", events: {"access-click": () => SquidlyAPI.speak(questionUtterance)}},
                {symbol: leftSymbol, displayValue: "previous", events: {"access-click":  (e) => onMoveQuestion(e, -1)}},
                {symbol: homeSymbol, displayValue: "home", events: {"access-click": onGoHome}},
                currentStep == totalSteps ? 
                    {symbol: resultsSymbol, theme:"noci-invert", displayValue: "results", events: {"access-click": onShowResult}} :
                    {symbol: rightSymbol, displayValue: "next", events: {"access-click": (e) => onMoveQuestion(e, 1)}},
            ]
        ], 0, 0)

        let main = this.add(new SvgPlus("div"), [1,3], [0, 4])
        main.classList.add("question-main")

        

        let a = main.createChild("div", {class: "assessment-progress"})
        let h = a.createChild("div", {class: "assessment-progress__header"})
        h.createChild("h1", {
            class: "assessment-title", 
            content: assessment?.title
        })
        h.createChild("p", {
            class: "assessment-progress__text", 
            content: `${assessment?.questionIndex + 1} / ${assessment?.questions?.length}`
        })
        a.createChild("div", {
            class: "assessment-progress__track", 
            role:"progressbar", 
            "aria-label": "Assessment progress",
            "aria-valuemin":"0",
            "aria-valuemax":"13",
            "aria-valuenow":"1",
            "aria-valuetext": "Question 1 of 13"
        }).createChild("div", {
            class: "assessment-progress__fill",
            style: {width: progressPercent + "%"}
        })

        let s = main.createChild("div", {class: "question-layout"})
        s.createChild("p", {
            class: "question-text",
            content: assessment?.currentQuestion().question
        })
        s.createChild("img", {
            class: "question-image",
            src: assessment?.currentQuestion().imageUrl,
            alt: assessment?.currentQuestion().imageDescription || "Question image"
        })


        let questions = main.createChild(QuestionOptions, {
            events: {
                "answer-selected": (e) => {
                    onAnswer(e, this.questions.selected);
                }
            }
        }, assessment?.currentQuestion(), assessment?.answerImages)
        questions.selected = assessment?.currentQuestionAnswer?.value;
        this.questions = questions;
    }
}

class ResultsView extends GridLayout {
    /**
     * @param {{assessment: Assessment, answersPayload: Object}} data
     */
    constructor({assessment, answersPayload, onGoHome}) {
        super(4,5)
        this.addItemInstance(NociButton, {
            symbol: homeSymbol, 
            displayValue: "home", 
            events: {"access-click": (e) => onGoHome(e)}
        }, 0, 3);
        this.addItemInstance(NociButton, {
            symbol: saveSymbol, 
            displayValue: "download", 
            events: {"access-click": this.download.bind(this)}
        }, 0, 4);

        let ql = this.add(new SvgPlus("div"), [1,3], [1,3])
        ql.classList.add("results-list-container")
        ql = ql.createChild("div", {class: "results-list"})
        ql.createChild("h1", {
            class: "results-title", 
            content: "Your Results"
        })
        for (let a of answersPayload?.answers||[]) {
            let qtext = assessment?.getQuestionById(a.questionId)?.question || "";
            let r = ql.createChild("div", {class: "result-item"})
            r.createChild("p", {content: qtext})
            r.createChild("p", {content: `${a.value}`})
        }
        this.payload = answersPayload;
    }

    download() {
        const text = this.toCSV(this.payload);
        const blob = new Blob([text], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `assessment_${this.payload.assessmentId}_results.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    toJSON(p) {
        return JSON.stringify(p, null, 2);
    }
    toCSV(p) {
        let header = [
            ["Assessment ID", "Assessment Version"],
            [p.assessmentVersion, p.assessmentId],
            ["", ""],
            ["Question ID", "Selected Answer", "Timestamp"]
        ].map(row => row.join(",")).join("\n")
        let rows = p.answers.map(({questionId, value, answeredAt}) => [questionId, value, answeredAt].join(",")).join("\n")
        return header + "\n" + rows;
    }
}

class MessageView extends GridLayout {
    constructor(message) {
        super(5,4)
        let el = new SvgPlus("div")
        el.textContent = message;
        this.add(el, [1,4], [1,3])
    }
}

class MenuView extends GridLayout {
    constructor({ assessmentIndex, onSelectAssessment }) {
        super(8,10)
        let title = this.add(new SvgPlus("div"), [0,1], [2,7])
        title.classList.add("menu-title")
        title.createChild("h1", {content: "Noci Pain Tracking"})
        title.createChild("p", {content: "Select an assessment to get started"})

        const p1 = this.add(new NociButton({
            displayValue: assessmentIndex[0].title,
            events: {
                "access-click": (e) => onSelectAssessment(e, assessmentIndex[0].id)
            }
        }), [3,4], [2, 4])

        const p2 = this.add(new NociButton({
            displayValue: assessmentIndex[1].title,
            events: {
                "access-click": (e) => onSelectAssessment(e, assessmentIndex[1].id)
            }
        }), [3,4], [5, 7]);

        const p3 = this.add(new NociButton({
            displayValue: assessmentIndex[2].title,
            events: {
                "access-click": (e) => onSelectAssessment(e, assessmentIndex[2].id)
            }
        }), [5,6], [2, 4]);

    }
}


export {QuestionView, ResultsView, MessageView, MenuView}