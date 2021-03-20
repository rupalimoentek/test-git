"If I run Grunt in the terminal in the middle of a forest, and nobody is around to see it, is Grunt really running?"
    - Davey W.
    
//////////////////////////
      ADDING FILES
//////////////////////////
    Note: If you add any library or 'vendor' javascript files, be sure to add them to
    the string array in grunt_tasks/files.js in the appropriate array so when your file gets loaded before
    unit tests are run. If you don't load the necessary library files then your test will most likely not pass for
    wherever the library is a dependency.
    
    

//////////////////////////
   WHY DO I NEED THIS?
//////////////////////////
    Grunt is a node module that allows us to continually have tasks running in the background that would otherwise be manually ran.
    Some of the types of tasks that Grunt automates is running units tests, linting files, validating formats of files, concatenating and/or minifying
     Javascript files, validating HTML files, parsing LESS styling sheets to CSS, trans-compiling Coffeescript to Javascript, running unit tests etc.

     For the server side we don't need grunt to validate any HTML, but it would nice to have it running unit tests for us continually. By continually I mean,
     that it's running in the terminal and will keep re-running itself. As fun as it is to manually type in a command to re-run unit tests every time, it's
     much more effective to just let it run it the back ground, and every time a change is made to one of the files, it will re-run itself, thereby making
     sure code hasn't been broken, or to check that the test you wrote is now passing.



//////////////////////////
          SET UP
//////////////////////////
    (May need need to use 'sudo' when running any of these commands in the terminal)
    Be sure to have
        - Nodejs installed, https://nodejs.org/ (which will give the ability to use 'npm install <stuff>' on the CLI
        - npm install -g grunt-cli



//////////////////////////
          USAGE
//////////////////////////
Run 'grunt' in the terminal in any of the directories of the repository, although most likely you'll probably be in the
    root directory of it, which is fine too.

This will ...
 - Validate config YML and JSON files
 - Lint source and test code for syntax/bad practices
 - Run unit tests

Then it will continually run in the background and on changes made it will lint your code
and run the unit tests


** REASONS THIS ISN'T WORKING

    For unit tests to work you need your NODE_ENV environment variable set to a valid string name
    usually it will be "development" or "local"

    If you're running your local server you would need this set anyway for the server to be running
    example...
    export NODE_ENV="development"

    if you don't do this then you'll get an error that has...
    Mocha exploded!
    >> TypeError: Cannot read property 'username' of undefined
    etc


** WHAT IS ... ?
    -_-_-__,------,
    -_-_-__|  /\_/\
    -_-_-_~|_( x .x)
    -_-_-_ ""  ""

    This is Nyan cat - see https://www.youtube.com/watch?v=QH2-TGUlwu4
    And for the 10 hour version see https://www.youtube.com/watch?v=wZZ7oFKsKzY

    It's pretty much for your entertainment since watching unit tests run the console probably isn't on anyone's bucket list,
        it seemed like a great idea to include Nyan cat in on the party.







If for some reason you want to skip the initial validation of YML and JSON files, just use
'grunt test'

