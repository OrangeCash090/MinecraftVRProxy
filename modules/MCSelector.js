class Selector {
    constructor(base, parameters) {
        this.base = base;
        this.parameters = parameters;

        this.toString = () => {
            var str = `${this.base}`;
            var fIteration1 = true;

            for (var [key, value] of Object.entries(this.parameters)) {
                if (fIteration1) {
                    str += "[";
                    fIteration1 = false;
                } else {
                    str += ",";
                }

                if (typeof value == "string" || typeof value == "number") {
                    str += `${key}=${value}`;
                } else if (typeof value == "object") {
                    var fIteration2 = true;

                    if (Array.isArray(value)) {
                        str += `${key}=[`;
                        var fIteration3 = true;

                        for (let i = 0; i < value.length; i++) {
                            fIteration3 = true;

                            if (fIteration2) {
                                fIteration2 = false;
                            } else {
                                str += ",";
                            }

                            str += "{";

                            for (var [deepKey, deepValue] of Object.entries(value[i])) {
                                if (fIteration3 == false) {
                                    str += ","
                                } else {
                                    fIteration3 = false;
                                }

                                str += `${deepKey}=${deepValue}`;
                            }

                            str += "}";
                        }

                        str += "]";
                    } else {
                        str += `${key}={`;

                        for (var [deepKey, deepValue] of Object.entries(value)) {
                            if (!fIteration2) {
                                str += ","
                            } else {
                                fIteration2 = false;
                            }

                            str += `${deepKey}=${deepValue}`;
                        }

                        str += "}";
                    }
                }
            }

            str += "]";

            return str;
        }

        this.add = (key, value) => {
            this.parameters[key] = value;
            return this.toString();
        }

        this.remove = (key, value) => {
            this.parameters[key] = undefined;
            return this.toString();
        }
    }
}

module.exports = Selector;