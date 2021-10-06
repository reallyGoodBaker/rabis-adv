/**
 * @param {string} name 
 * @returns {(message:string) => Error}
 */
export function ErrorBuilder(name) {
      let _throw = message => {
            let err = Error(message);
            err.name = name;
            err.throwThis = function() {
                  console.error(err);
            }
            return hideStack(err);
      }
      return _throw;
}

/**
 * @param {Error} err 
 * @returns {Error}
 */
export function hideStack(err) {
      let stack = err.stack.split('\n'),
      errMsg = stack.shift();
      stack.shift();
      stack.unshift(errMsg);
      err.stack = stack.join('\n');
      return err;
}

const lc_build = (tag) =>  ErrorBuilder(`[LifeCycle${tag}]`);
export class LifeCycleError {
      static err_init = lc_build('Init');
      static err_runtime = lc_build('Runtime');
      static err_pause = lc_build('Pause');
      static err_resume = lc_build('Resume');
}

export function falseAssertion(msg) {
      let err = ErrorBuilder('Assertion failed')(msg);
      throw err;
}
