export function handleIPV6(ip: string) {
  if (ip.slice(0, 7) == '::ffff:') {
    return ip.slice(7, ip.length);
  }

  return ip;
}

export function persianStringJoin(arr: string[]): string {
  return arr.join();
}

export function containsPersianChar(str) {
  const regExp = /^[\u0600-\u06FF\s]+$/;

  return regExp.test(str);
}
export function likeRegx(value: string) {
  return { $regex: new RegExp(value, 'i') };
}
