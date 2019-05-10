/**
 * Math Library
 */
let GameMath = {
	// Random of Float numbers
	FloatBetween: function(a, b) {
		return (Math.random() * (a - b) + b);
	},

	// Random of Int number
	Between: function(a, b) {
		return (Math.random() * (a - b) + b) & 0xfff;
	}
};