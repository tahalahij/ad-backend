

export function handleIPV6(ip: string) {
  if (ip.slice(0, 7) == '::ffff:') {
    return ip.slice(7, ip.length);
  }

  return ip;
}

export function persianStringJoin(arr: string[]): string {
  return arr.join();
}
export function likeRegx(value:string) {
 const  regex = new RegExp(["^", value, "$"].join(""), "i");
  return regex
}
