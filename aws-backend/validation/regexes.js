/** Allow string in pattern NNNN + (optional space) + two letters */
export const zipCodeRegex = new RegExp(/^[1-9][0-9]{3} ?(?!sa|sd|ss)[a-z]{2}$/i);
/** Allow string with number, letters, ', - . */
export const houseNumberRegex = new RegExp(/^[0-9A-Za-z\s\-\/]+$/);
