function _do_test(aInputSource, aInputIndexExpression, aExpected)
{
	loutput = ApplyIndexExpressionToArray(aInputSource, aInputIndexExpression)

	if ( aExpected && loutput && (aExpected.length == loutput.length) )
	{
		for (lindex in aExpected)
		{
			if (!(aExpected[lindex] == loutput[lindex]))
			{
				throw "Arrays don't match, aExpected=" + aExpected + ", loutput=" + loutput
			}
		}
	}
	else throw "Arrays don't match, aExpected=" + aExpected + ", loutput=" + loutput
}

function bOTL_doall_tests()
{
	_test1()
	_test2()
	_test3()
	_test4()
	_test5()
	_test6()
	_test7()
	_test8()
	_test9()
}

function _test1()
{
		linputSource = ["thing1", "thing2", "thing3", "thing4"]
		linputIndexExpression = "2"
		lexpected = ["thing3"]
		_do_test(linputSource, linputIndexExpression, lexpected)
}

function _test2()
{
		linputSource = ["thing1", "thing2", "thing3", "thing4"]
		linputIndexExpression = "4"
		lexpected = []
		_do_test(linputSource, linputIndexExpression, lexpected)
}

function _test3()
{
		linputSource = ["thing1", "thing2", "thing3", "thing4"]
		linputIndexExpression = "fred"
		lexpected = []
		_do_test(linputSource, linputIndexExpression, lexpected)
}

function _test4()
{
		linputSource = ["thing1", "thing2", "thing3", "thing4"]
		linputIndexExpression = ":2"
		lexpected = ["thing1", "thing2"]
		_do_test(linputSource, linputIndexExpression, lexpected)
}

function _test5()
{
		linputSource = ["thing1", "thing2", "thing3", "thing4"]
		linputIndexExpression = "2:"
		lexpected = ["thing3", "thing4"]
		_do_test(linputSource, linputIndexExpression, lexpected)
}

function _test6()
{
		linputSource = ["thing1", "thing2", "thing3", "thing4"]
		linputIndexExpression = "1:3"
		lexpected = ["thing2", "thing3"]
		_do_test(linputSource, linputIndexExpression, lexpected)
}

function _test7()
{
		linputSource = ["thing1", "thing2", "thing3", "thing4"]
		linputIndexExpression = ":"
		lexpected = linputSource
		_do_test(linputSource, linputIndexExpression, lexpected)
}

function _test8()
{
		linputSource = ["thing1", "thing2", "thing3", "thing4"]
		linputIndexExpression = "7:"
		lexpected = []
		_do_test(linputSource, linputIndexExpression, lexpected)
}

function _test9()
{
		linputSource = ["thing1", "thing2", "thing3", "thing4"]
		linputIndexExpression = "-1:"
		lexpected = ["thing4"]
		_do_test(linputSource, linputIndexExpression, lexpected)
}

/*
function _test10()
{
		linputSource = ["thing1", "thing2", "thing3", "thing4"]
		linputIndexExpression = "1::2"
		lexpected = ["thing2", "thing4"]
		_do_test(linputSource, linputIndexExpression, lexpected)
}
*/
