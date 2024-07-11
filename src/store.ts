import { action, autorun, computed, makeObservable, observable, observe, reaction } from "mobx";

export class Layer {
    title: string = "";
    opacity: number = 1;
    sublayers?: Array<Layer> = [];
    constructor({ title, opacity, sublayers }: {title: string, opacity: number, sublayers: Array<Layer>}) {
        makeObservable(this,
            {
                title: observable,
                opacity: observable,
                sublayers: observable
            }
        );
        this.title = title;
        this.opacity = opacity;
        this.sublayers = sublayers;
        reaction(() => this.sublayers.map(s => s), (sublayers) => { console.log("Sublayers changed", sublayers) });
    }

    addSublayer?(layer: Layer) {
        console.log("adding sublayer");
        this.sublayers.push(layer);
    }
}

class LayerStore {
    layers = [new Layer({
        title: "Boundaries",
        opacity: 1,
        sublayers: [
            {
                title: "Subboundaries",
                opacity: 0.5
            }
        ]
    })];
    constructor() {
        console.log("store was created");
        makeObservable(this, {
            layers: observable,
            layerCount: computed,
            addLayer: action
        });
        reaction(() => this.layers.map(l => l), (layers) => console.log("Layers", layers));
    }
    
    get layerCount () {
        return this.layers.length;
    }

    addLayer(layer: Layer) {
        console.log("adding layer", layer);
        this.layers.push(layer);
    }
}

const layerStore = new LayerStore();

export default layerStore;




// class ObservableTodoStore {
//     todos = [];
//     pendingRequests = 0;

//     constructor() {
//         makeObservable(this, {
//             todos: observable,
//             pendingRequests: observable,
//             completedTodosCount: computed,
//             report: computed,
//             addTodo: action,
//         });
//         reaction(() => this.todos.length, (todos) => console.log(todos));
//     }

//     get completedTodosCount() {
//         return this.todos.filter(
//             todo => todo.completed === true
//         ).length;
//     }

//     get report() {
//         if (this.todos.length === 0)
//             return "<none>";
//         const nextTodo = this.todos.find(todo => todo.completed === false);
//         return `Next todo: "${nextTodo ? nextTodo.task : "<none>"}". ` +
//             `Progress: ${this.completedTodosCount}/${this.todos.length}`;
//     }

//     addTodo(task) {
//         this.todos.push({
//             task: task,
//             completed: false,
//             assignee: null
//         });
//     }
// }

// const observableTodoStore = new ObservableTodoStore();
// export default observableTodoStore;