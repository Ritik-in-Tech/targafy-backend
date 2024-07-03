export const generateRandomNumber = (targetValue, numberOfDays) => {
  if (numberOfDays <= 0) {
    throw new Error("Number of days must be greater than 0.");
  }
  const maxValuePerDay = targetValue / numberOfDays;

  const randomNumber = Math.random() * (2 * maxValuePerDay);

  const intRandomNumber = Math.floor(randomNumber);

  return intRandomNumber.toString();
};
