This is a friendly HTML editor that uses [slowparse][] and [hacktionary][]
to provide ultra-friendly real-time help to novice webmakers.

## How do I hack the framework?
To get started, you'll need to get a local copy of this repository and you'll need a web server running on your computer.

### Getting the code
Download the source as a zip archive from this page, or use git to clone the reposotory.

### Getting a web server
You're OS might come with a web server that you can use (lucky you!). If not, there's a small web server in this repository that runs in node.js.

1. Make sure you have a recent version of `node` installed (>=0.6). See [here](http://nodejs.org/) for details on how to do this for your platform.
2. Install package dependencies

            npm install

3. Install `jake` globally.

            npm install -g jake

4. Open a terminal, navigate to the top-level directory of your local repository. Run the web server.

            jake serve

5. Go to the following URL in your browser to view the examples. Be sure to use a recent version of Firefox or Chrome.

            http://localhost:1337

## Updating CodeMirror

In the `codemirror2` directory is a mini-distribution of [CodeMirror][]
which contains only the files necessary for HTML editing. It can be updated
with the following Python script, if it is run from the root directory
of the repository and the value of `NEW_CODEMIRROR_PATH` is changed:

```python
import os

NEW_CODEMIRROR_PATH = "/path/to/new/codemirror/version"
OUR_CODEMIRROR_PATH = os.path.abspath("codemirror2")

for dirpath, dirnames, filenames in os.walk(OUR_CODEMIRROR_PATH):
    for filename in filenames:
        ourpath = os.path.join(dirpath, filename)
        relpath = os.path.relpath(ourpath, OUR_CODEMIRROR_PATH)
        newpath = os.path.join(NEW_CODEMIRROR_PATH, relpath)
        if os.path.exists(newpath):
            print "copying %s" % newpath
            open(ourpath, "wb").write(open(newpath, "rb").read())
```

  [slowparse]: https://github.com/toolness/slowparse
  [hacktionary]: https://github.com/toolness/hacktionary
  [CodeMirror]: http://codemirror.net/
