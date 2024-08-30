const { Vec3 } = require("vec3")
const Quaternion = require("quaternion")

function CFrameFromQuaternion(quaternion) {
    let q0 = quaternion.w;
    let q1 = quaternion.x;
    let q2 = quaternion.y;
    let q3 = quaternion.z;

    let m11 = 1 - 2 * (q2 * q2 + q3 * q3);
    let m12 = 2 * (q1 * q2 - q0 * q3);
    let m13 = 2 * (q1 * q3 + q0 * q2);
    let m21 = 2 * (q1 * q2 + q0 * q3);
    let m22 = 1 - 2 * (q1 * q1 + q3 * q3);
    let m23 = 2 * (q2 * q3 - q0 * q1);
    let m31 = 2 * (q1 * q3 - q0 * q2);
    let m32 = 2 * (q2 * q3 + q0 * q1);
    let m33 = 1 - 2 * (q1 * q1 + q2 * q2);

    return new CFrame(0, 0, 0, m11, m12, m13, m21, m22, m23, m31, m32, m33);
}

function CFAngles(x, y, z) {
    let qx = Quaternion.fromAxisAngle([1,0,0], x);
    let qy = Quaternion.fromAxisAngle([0,1,0], y);
    let qz = Quaternion.fromAxisAngle([0,0,1], z);

    let combinedQuaternion = qx.mul(qy).mul(qz);
    let cf = CFrameFromQuaternion(combinedQuaternion);
    
    return cf;
}

function CFVec3(v) {
    return new CFrame(v.x, v.y, v.z);
}

class CFrame {
    constructor(x, y, z, n11 = 1, n12 = 0, n13 = 0, n21 = 0, n22 = 1, n23 = 0, n31 = 0, n32 = 0, n33 = 1) {
        this.m14 = x; this.m24 = y; this.m34 = z;
        this.m11 = n11; this.m12 = n12; this.m13 = n13;
        this.m21 = n21; this.m22 = n22; this.m23 = n23;
        this.m31 = n31; this.m32 = n32; this.m33 = n33;
        this.m41 = 0; this.m42 = 0; this.m43 = 0; this.m44 = 1;
        this.x = this.m14; this.y = this.m24; this.z = this.m34;
        this.position = new Vec3(this.m14, this.m24, this.m34);
        this.rotation = new Vec3(Math.atan2(-this.m23, this.m33), Math.asin(this.m13), Math.atan2(-this.m12, this.m11));
        this.lookVector = new Vec3(-this.m13, -this.m23, -this.m33);
        this.rightVector = new Vec3(this.m11, this.m21, this.m31);
        this.upVector = new Vec3(this.m12, this.m22, this.m32);
    }

    add(b) {
        let ac = this.components();
        let x = ac[0], y = ac[1], z = ac[2], m11 = ac[3], m12 = ac[4], m13 = ac[5], m21 = ac[6], m22 = ac[7], m23 = ac[8], m31 = ac[9], m32 = ac[10], m33 = ac[11];
        return new CFrame(x + b.x, y + b.y, z + b.z, m11, m12, m13, m21, m22, m23, m31, m32, m33);
    }
    
    subtract(b) {
        let ac = this.components();
        let x = ac[0], y = ac[1], z = ac[2], m11 = ac[3], m12 = ac[4], m13 = ac[5], m21 = ac[6], m22 = ac[7], m23 = ac[8], m31 = ac[9], m32 = ac[10], m33 = ac[11];
        return new CFrame(x - b.x, y - b.y, z - b.z, m11, m12, m13, m21, m22, m23, m31, m32, m33);
    }
    
    multiplyVector(b) {
        let ac = this.components();
        let x = ac[0], y = ac[1], z = ac[2], m11 = ac[3], m12 = ac[4], m13 = ac[5], m21 = ac[6], m22 = ac[7], m23 = ac[8], m31 = ac[9], m32 = ac[10], m33 = ac[11];
        let right = new Vec3(m11, m21, m31);
        let up = new Vec3(m12, m22, m32);
        let back = new Vec3(m13, m23, m33);
        return this.position.add(right.multiply(b.x).add(up.multiply(b.y)).add(back.multiply(b.z)));
    }
    
    multiply(b) {
        let ac = this.components();
        let bc = b.components();

        let a14 = ac[0], a24 = ac[1], a34 = ac[2], a11 = ac[3], a12 = ac[4], a13 = ac[5], a21 = ac[6], a22 = ac[7], a23 = ac[8], a31 = ac[9], a32 = ac[10], a33 = ac[11];
        let b14 = bc[0], b24 = bc[1], b34 = bc[2], b11 = bc[3], b12 = bc[4], b13 = bc[5], b21 = bc[6], b22 = bc[7], b23 = bc[8], b31 = bc[9], b32 = bc[10], b33 = bc[11];
        let n11 = a11 * b11 + a12 * b21 + a13 * b31 + a14 * this.m41;
        let n12 = a11 * b12 + a12 * b22 + a13 * b32 + a14 * this.m42;
        let n13 = a11 * b13 + a12 * b23 + a13 * b33 + a14 * this.m43;
        let n14 = a11 * b14 + a12 * b24 + a13 * b34 + a14 * this.m44;
        let n21 = a21 * b11 + a22 * b21 + a23 * b31 + a24 * this.m41;
        let n22 = a21 * b12 + a22 * b22 + a23 * b32 + a24 * this.m42;
        let n23 = a21 * b13 + a22 * b23 + a23 * b33 + a24 * this.m43;
        let n24 = a21 * b14 + a22 * b24 + a23 * b34 + a24 * this.m44;
        let n31 = a31 * b11 + a32 * b21 + a33 * b31 + a34 * this.m41;
        let n32 = a31 * b12 + a32 * b22 + a33 * b32 + a34 * this.m42;
        let n33 = a31 * b13 + a32 * b23 + a33 * b33 + a34 * this.m43;
        let n34 = a31 * b14 + a32 * b24 + a33 * b34 + a34 * this.m44;
        let n41 = this.m41 * b11 + this.m42 * b21 + this.m43 * b31 + this.m44 * this.m41;
        let n42 = this.m41 * b12 + this.m42 * b22 + this.m43 * b32 + this.m44 * this.m42;
        let n43 = this.m41 * b13 + this.m42 * b23 + this.m43 * b33 + this.m44 * this.m43;
        let n44 = this.m41 * b14 + this.m42 * b24 + this.m43 * b34 + this.m44 * this.m44;

        return new CFrame(n14, n24, n34, n11, n12, n13, n21, n22, n23, n31, n32, n33);
    }
    
    getDeterminant() {
        let ac = this.components();
        let a14 = ac[0], a24 = ac[1], a34 = ac[2], a11 = ac[3], a12 = ac[4], a13 = ac[5], a21 = ac[6], a22 = ac[7], a23 = ac[8], a31 = ac[9], a32 = ac[10], a33 = ac[11];
        let det = (a11 * a22 * a33 * this.m44 + a11 * a23 * a34 * this.m42 + a11 * a24 * a32 * this.m43
            + a12 * a21 * a34 * this.m43 + a12 * a23 * a31 * this.m44 + a12 * a24 * a33 * this.m41
            + a13 * a21 * a32 * this.m44 + a13 * a22 * a34 * this.m41 + a13 * a24 * a31 * this.m42
            + a14 * a21 * a33 * this.m42 + a14 * a22 * a31 * this.m43 + a14 * a23 * a32 * this.m41
            - a11 * a22 * a34 * this.m43 - a11 * a23 * a32 * this.m44 - a11 * a24 * a33 * this.m42
            - a12 * a21 * a33 * this.m44 - a12 * a23 * a34 * this.m41 - a12 * a24 * a31 * this.m43
            - a13 * a21 * a34 * this.m42 - a13 * a22 * a31 * this.m44 - a13 * a24 * a32 * this.m41
            - a14 * a21 * a32 * this.m43 - a14 * a22 * a33 * this.m41 - a14 * a23 * a31 * this.m42);
        return det;
    }
    
    invert4x4() {
        let ac = this.components();
        let a14 = ac[0], a24 = ac[1], a34 = ac[2], a11 = ac[3], a12 = ac[4], a13 = ac[5], a21 = ac[6], a22 = ac[7], a23 = ac[8], a31 = ac[9], a32 = ac[10], a33 = ac[11];
        let det = this.getDeterminant(this);
        if (det == 0) { return this; }
        let b11 = (a22 * a33 * this.m44 + a23 * a34 * this.m42 + a24 * a32 * this.m43 - a22 * a34 * this.m43 - a23 * a32 * this.m44 - a24 * a33 * this.m42) / det;
        let b12 = (a12 * a34 * this.m43 + a13 * a32 * this.m44 + a14 * a33 * this.m42 - a12 * a33 * this.m44 - a13 * a34 * this.m42 - a14 * a32 * this.m43) / det;
        let b13 = (a12 * a23 * this.m44 + a13 * a24 * this.m42 + a14 * a22 * this.m43 - a12 * a24 * this.m43 - a13 * a22 * this.m44 - a14 * a23 * this.m42) / det;
        let b14 = (a12 * a24 * a33 + a13 * a22 * a34 + a14 * a23 * a32 - a12 * a23 * a34 - a13 * a24 * a32 - a14 * a22 * a33) / det;
        let b21 = (a21 * a34 * this.m43 + a23 * a31 * this.m44 + a24 * a33 * this.m41 - a21 * a33 * this.m44 - a23 * a34 * this.m41 - a24 * a31 * this.m43) / det;
        let b22 = (a11 * a33 * this.m44 + a13 * a34 * this.m41 + a14 * a31 * this.m43 - a11 * a34 * this.m43 - a13 * a31 * this.m44 - a14 * a33 * this.m41) / det;
        let b23 = (a11 * a24 * this.m43 + a13 * a21 * this.m44 + a14 * a23 * this.m41 - a11 * a23 * this.m44 - a13 * a24 * this.m41 - a14 * a21 * this.m43) / det;
        let b24 = (a11 * a23 * a34 + a13 * a24 * a31 + a14 * a21 * a33 - a11 * a24 * a33 - a13 * a21 * a34 - a14 * a23 * a31) / det;
        let b31 = (a21 * a32 * this.m44 + a22 * a34 * this.m41 + a24 * a31 * this.m42 - a21 * a34 * this.m42 - a22 * a31 * this.m44 - a24 * a32 * this.m41) / det;
        let b32 = (a11 * a34 * this.m42 + a12 * a31 * this.m44 + a14 * a32 * this.m41 - a11 * a32 * this.m44 - a12 * a34 * this.m41 - a14 * a31 * this.m42) / det;
        let b33 = (a11 * a22 * this.m44 + a12 * a24 * this.m41 + a14 * a21 * this.m42 - a11 * a24 * this.m42 - a12 * a21 * this.m44 - a14 * a22 * this.m41) / det;
        let b34 = (a11 * a24 * a32 + a12 * a21 * a34 + a14 * a22 * a31 - a11 * a22 * a34 - a12 * a24 * a31 - a14 * a21 * a32) / det;
        let b41 = (a21 * a33 * this.m42 + a22 * a31 * this.m43 + a23 * a32 * this.m41 - a21 * a32 * this.m43 - a22 * a33 * this.m41 - a23 * a31 * this.m42) / det;
        let b42 = (a11 * a32 * this.m43 + a12 * a33 * this.m41 + a13 * a31 * this.m42 - a11 * a33 * this.m42 - a12 * a31 * this.m43 - a13 * a32 * this.m41) / det;
        let b43 = (a11 * a23 * this.m42 + a12 * a21 * this.m43 + a13 * a22 * this.m41 - a11 * a22 * this.m43 - a12 * a23 * this.m41 - a13 * a21 * this.m42) / det;
        let b44 = (a11 * a22 * a33 + a12 * a23 * a31 + a13 * a21 * a32 - a11 * a23 * a32 - a12 * a21 * a33 - a13 * a22 * a31) / det;
        return new CFrame(b14, b24, b34, b11, b12, b13, b21, b22, b23, b31, b32, b33);
    }
    
    quaternionFromCFrame() {
        let ac = this.components();
        let mx = ac[0], my = ac[1], mz = ac[2], m11 = ac[3], m12 = ac[4], m13 = ac[5], m21 = ac[6], m22 = ac[7], m23 = ac[8], m31 = ac[9], m32 = ac[10], m33 = ac[11];
        let trace = m11 + m22 + m33;
        let w = 1, i = 0, j = 0, k = 0;
        if (trace > 0) {
            let s = Math.sqrt(1 + trace);
            let r = 0.5 / s;
            w = s * 0.5; i = (m32 - m23) * r; j = (m13 - m31) * r; k = (m21 - m12) * r;
        } else {
            let big = Math.max(Math.max(m11, m22), m33);
            if (big == m11) {
                let s = Math.sqrt(1 + m11 - m22 - m33);
                let r = 0.5 / s;
                w = (m32 - m23) * r; i = 0.5 * s; j = (m21 + m12) * r; k = (m13 + m31) * r;
            } else if (big == m22) {
                let s = Math.sqrt(1 - m11 + m22 - m33);
                let r = 0.5 / s;
                w = (m13 - m31) * r; i = (m21 + m12) * r; j = 0.5 * s; k = (m32 + m23) * r;
            } else if (big == m33) {
                let s = Math.sqrt(1 - m11 - m22 + m33);
                let r = 0.5 / s;
                w = (m21 - m12) * r; i = (m13 + m31) * r; j = (m32 + m23) * r; k = 0.5 * s;
            }
        }
        return [w, i, j, k];
    }

    lerpinternal(b, t) {
        let cf = this.inverse().multiply(b);
        let q = this.quaternionFromCFrame(cf);
        let w = q[0], i = q[1], j = q[2], k = q[3];
        let theta = Math.acos(w) * 2;
        let v = new Vec3(i, j, k);
        let p = this.position.lerp(b.p, t);
        if (theta !== 0) {
            let r = this.multiply(fromAxisAngle(v, theta * t));
            return r.subtract(r.p).add(p);
        } else {
            return this.subtract(this.position).add(p);
        }
    }
    
    inverse() {
        return this.invert4x4(this);
    }
    
    lerp(cf2, t) {
        return this.lerpinternal(this, cf2, t);
    }
    
    toWorldSpace(cf2) {
        return this.multiply(cf2);
    }
    
    toObjectSpace(cf2) {
        return this.inverse().multiply(cf2);
    }
    
    pointToWorldSpace(v) {
        return this.multiply(v);
    }
    
    pointToObjectSpace(v) {
        return this.inverse().multiply(v);
    }
    
    vectorToWorldSpace(v) {
        return this.subtract(this.position).multiply(v);
    }
    
    vectorToObjectSpace(v) {
        return this.subtract(this.position).inverse().multiply(v);
    }
    
    components() {
        return [this.m14, this.m24, this.m34, this.m11, this.m12, this.m13, this.m21, this.m22, this.m23, this.m31, this.m32, this.m33];
    }
    
    toEulerAnglesXYZ() {
        let x = Math.atan2(-this.m23, this.m33);
        let y = Math.asin(this.m13);
        let z = Math.atan2(-this.m12, this.m11);
        return [x, y, z];
    }    
}

module.exports = { CFrame, CFAngles, CFVec3 }